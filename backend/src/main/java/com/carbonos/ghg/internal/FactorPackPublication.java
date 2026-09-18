package com.carbonos.ghg.internal;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.TreeMap;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.carbonos.media.MediaStorage;
import com.carbonos.media.MediaStorageException;

/**
 * Publishing an edition (spec 02.5). Publication is one act with one record:
 * the source document with its SHA-256, every validation rule passing, the
 * applies-from date, an approver who is not the curator, the change log frozen
 * against the predecessor, and one notice raised for every organization that
 * holds a lineage the predecessor carried.
 *
 * <p><strong>Publishing moves no client's numbers.</strong> Nothing here writes
 * to {@code ghg_emission_factors}, to an assignment or to a run. An edition is
 * the unit of vintage and adopting one is an accounting decision that belongs
 * to the organization, which spec 02.7 governs; this service raises that
 * decision and stops.
 */
@Service
@Transactional
public class FactorPackPublication {

	/** A source document larger than this is not a publication extract but a mistake. */
	static final long MAX_EVIDENCE_BYTES = 50L * 1024 * 1024;

	/** Where an edition's source document is stored in the media module. */
	static final String EVIDENCE_PREFIX = "ghg/factor-packs/";

	/** A withdrawal states why, at least this long, because it leaves a record a verifier reads. */
	static final int MIN_WITHDRAWAL_REASON = 10;

	/** The source document as it was stored, with the checksum computed over the bytes. */
	public record Evidence(String key, String name, long size, String checksum) {
	}

	/** What an approver states when publishing. */
	public record PublishRequest(String sourceDocument, LocalDate appliesFrom, boolean erratum, String erratumNote) {
	}

	private final FactorPackEditionRepository editions;
	private final FactorPackRowRepository rows;
	private final FactorPackChangeRepository changes;
	private final FactorPackEventRepository events;
	private final FactorPackNoticeRepository notices;
	private final EmissionFactorRepository emissionFactors;
	private final FactorPackValidation validation;
	private final FactorPackBlastRadius blastRadius;
	private final FactorPacks packs;
	private final MediaStorage media;

	FactorPackPublication(FactorPackEditionRepository editions, FactorPackRowRepository rows,
			FactorPackChangeRepository changes, FactorPackEventRepository events, FactorPackNoticeRepository notices,
			EmissionFactorRepository emissionFactors, FactorPackValidation validation,
			FactorPackBlastRadius blastRadius, FactorPacks packs, MediaStorage media) {
		this.editions = editions;
		this.rows = rows;
		this.changes = changes;
		this.events = events;
		this.notices = notices;
		this.emissionFactors = emissionFactors;
		this.validation = validation;
		this.blastRadius = blastRadius;
		this.packs = packs;
		this.media = media;
	}

	// --- the evidence -------------------------------------------------------

	/**
	 * Stores the source document an approver checks the edition against and
	 * records its SHA-256. The checksum is computed over the bytes received, so
	 * it is the hash of what was stored rather than a figure the caller states.
	 */
	public Evidence attachEvidence(FactorPackEdition edition, MultipartFile file, UUID actorId, String actorEmail) {
		if (file == null || file.isEmpty()) {
			throw new GhgFieldException("evidence", "Choose the source document this edition is published against.");
		}
		if (file.getSize() > MAX_EVIDENCE_BYTES) {
			throw new GhgFieldException("evidence", "The source document is larger than 50 MB.");
		}
		byte[] bytes;
		try (InputStream in = file.getInputStream()) {
			bytes = in.readAllBytes();
		}
		catch (IOException ex) {
			throw new MediaStorageException("Failed to read the uploaded source document", ex);
		}
		var checksum = sha256(bytes);
		var name = file.getOriginalFilename() == null || file.getOriginalFilename().isBlank() ? "source-document"
				: file.getOriginalFilename().replaceAll("[\\\\/]", "_");
		var key = EVIDENCE_PREFIX + edition.getEditionId() + "/" + checksum;
		var contentType = file.getContentType() == null ? "application/octet-stream" : file.getContentType();
		media.put(key, new java.io.ByteArrayInputStream(bytes), bytes.length, contentType);
		edition.attachEvidence(key, name, bytes.length, checksum);
		events.save(new FactorPackEvent(edition.getEditionId(), FactorPackEvent.Action.EVIDENCE_ATTACHED, actorId,
				actorEmail, name + " (" + bytes.length + " bytes), SHA-256 " + checksum));
		return new Evidence(key, name, bytes.length, checksum);
	}

	/** The stored source document, for an approver who wants to read what they are signing. */
	@Transactional(readOnly = true)
	public com.carbonos.media.StoredMedia openEvidence(FactorPackEdition edition) {
		if (edition.getEvidenceKey() == null) {
			throw new GhgRuleViolationException("'" + edition.getEditionId()
					+ "' carries no source document yet. Upload the publication it is transcribed from.");
		}
		return media.get(edition.getEvidenceKey());
	}

	// --- publication --------------------------------------------------------

	/**
	 * Publishes the edition: freezes it and its rows, writes the change log
	 * against the predecessor, marks the predecessor superseded, and raises one
	 * notice per holding organization. Every gate the spec names is checked
	 * first, because a published edition is a citation and half a record is
	 * worse than none.
	 */
	public FactorPackEdition publish(FactorPackEdition edition, PublishRequest request, UUID approverUserId,
			String approverEmail, String approverName) {
		requireDraft(edition);
		requireSeparationOfDuties(edition, approverUserId, approverEmail);
		var sourceDocument = required("sourceDocument", request.sourceDocument(),
				"Name the source document this edition was checked against, as a verifier would cite it.");
		var appliesFrom = request.appliesFrom() == null ? edition.getAppliesFrom() : request.appliesFrom();
		if (appliesFrom == null) {
			throw new GhgFieldException("appliesFrom",
					"Give the date the edition applies from. It is the vintage boundary an adoption is run from.");
		}
		if (edition.getEvidenceChecksum() == null || edition.getEvidenceKey() == null) {
			throw new GhgFieldException("evidence",
					"Upload the source document first. A published edition is a citation, so the document it was "
							+ "transcribed from is kept with its SHA-256.");
		}
		var editionRows = rows.findAllByEditionIdOrderByOrdinalAsc(edition.getEditionId());
		if (editionRows.isEmpty()) {
			throw new GhgRuleViolationException("'" + edition.getEditionId()
					+ "' holds no rows. An empty edition publishes nothing a verifier could sample.");
		}
		var findings = validation.validate(edition, editionRows);
		if (!findings.isEmpty()) {
			throw new GhgRuleViolationException(refusal(edition, findings));
		}
		if (request.erratum() && request.erratumNote() != null && request.erratumNote().length() > 1000) {
			throw new GhgFieldException("erratumNote", "Keep the erratum note under 1,000 characters.");
		}

		var predecessor = blastRadius.predecessorOf(edition);
		var predecessorRows = predecessor == null ? List.<FactorPackRow>of()
				: rows.findAllByEditionIdOrderByOrdinalAsc(predecessor.getEditionId());
		var log = blastRadius.changes(editionRows, predecessorRows);

		edition.publish(approverUserId, approverEmail, approverName, sourceDocument, appliesFrom,
				predecessor == null ? null : predecessor.getEditionId(), request.erratum(),
				trimToNull(request.erratumNote()));
		changes.saveAll(log);
		events.save(new FactorPackEvent(edition.getEditionId(), FactorPackEvent.Action.PUBLISHED, approverUserId,
				approverEmail, summary(log, predecessor)));

		if (predecessor != null && predecessor.getStatus() == FactorPackStatus.PUBLISHED) {
			// spec 02.5: an erratum's predecessor keeps its wrong values and records that it holds an
			// error, because reports already rest on them
			predecessor.supersede(request.erratum()
					? "Superseded by the erratum " + edition.getEditionId()
							+ (trimToNull(request.erratumNote()) == null ? "." : ": " + request.erratumNote().trim())
					: null);
			events.save(new FactorPackEvent(predecessor.getEditionId(), FactorPackEvent.Action.SUPERSEDED,
					approverUserId, approverEmail, "Superseded by " + edition.getEditionId() + "."));
		}

		raiseNotices(edition, predecessor, predecessorRows, editionRows);
		packs.invalidateAfterCommit();
		return edition;
	}

	/**
	 * One notice per organization holding a lineage the predecessor carried
	 * (spec 02.7). An organization holding none gets none, and nothing about
	 * its factors, assignments or runs is touched: the notice is the whole of
	 * what a publication does to a tenant. A lineage is counted once, against
	 * its live version, however many versions an earlier adoption cut.
	 */
	private void raiseNotices(FactorPackEdition edition, FactorPackEdition predecessor,
			List<FactorPackRow> predecessorRows, List<FactorPackRow> editionRows) {
		if (predecessor == null || predecessorRows.isEmpty()) {
			return;
		}
		var proposed = new LinkedHashMap<String, FactorPackRow>();
		editionRows.forEach(row -> proposed.put(row.getCode(), row));
		var codes = predecessorRows.stream()
			.map(FactorPackRow::getCode)
			.collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
		var held = emissionFactors.heldByCode(codes);
		var byOrganization = new LinkedHashMap<UUID, List<EmissionFactor>>();
		for (var factor : held) {
			byOrganization.computeIfAbsent(factor.getOrganizationId(), key -> new ArrayList<>()).add(factor);
		}
		for (var entry : byOrganization.entrySet()) {
			var comparison = new TreeMap<String, String>();
			var affected = 0;
			var overThreshold = 0;
			var scopes = new java.util.TreeSet<String>();
			for (var factor : FactorPackBlastRadius.liveByCode(entry.getValue()).values()) {
				var row = proposed.get(factor.getPackCode());
				var newValue = row == null ? null : row.getKgCo2ePerUnit();
				comparison.put(factor.getPackCode(), plain(factor.getKgCo2ePerUnit()) + "|"
						+ (newValue == null ? "discontinued" : plain(newValue)));
				if (newValue == null) {
					continue;
				}
				var percent = FactorPackChange.percentChange(factor.getKgCo2ePerUnit(), newValue);
				if (percent != null && percent.signum() != 0) {
					affected++;
					scopes.add(factor.getDefaultScope().name());
					if (FactorPackBlastRadius.overThreshold(percent)) {
						overThreshold++;
					}
				}
			}
			var delta = blastRadius.estimatedDeltaOf(entry.getKey(), entry.getValue(), proposed);
			notices.save(new FactorPackNotice(entry.getKey(), edition.getEditionId(), predecessor.getEditionId(),
					FactorPackBlastRadius.diffHash(comparison), affected, overThreshold, delta,
					scopes.isEmpty() ? null : String.join(",", scopes)));
		}
	}

	// --- withdrawal ---------------------------------------------------------

	/**
	 * Withdraws a published edition with a reason. It leaves the import list and
	 * every open notice for it closes; the rows organizations hold stay exactly
	 * as they are, because a withdrawal is the publisher's act and not the
	 * client's recalculation.
	 */
	public FactorPackEdition withdraw(FactorPackEdition edition, String reason, UUID actorId, String actorEmail) {
		if (edition.getStatus() == FactorPackStatus.DRAFT) {
			throw new GhgRuleViolationException("'" + edition.getEditionId()
					+ "' is a draft, which no organization can see. Delete it instead of withdrawing it.");
		}
		if (edition.getStatus() == FactorPackStatus.WITHDRAWN) {
			throw new GhgRuleViolationException("'" + edition.getEditionId() + "' is already withdrawn.");
		}
		var trimmed = reason == null ? "" : reason.trim();
		if (trimmed.length() < MIN_WITHDRAWAL_REASON) {
			throw new GhgFieldException("reason", "Say why the edition is withdrawn, in at least "
					+ MIN_WITHDRAWAL_REASON + " characters. It is the record a verifier reads beside the figures "
					+ "that rest on it.");
		}
		edition.withdraw(trimmed, actorEmail);
		var closed = notices.findAllByEditionIdAndStatus(edition.getEditionId(), FactorPackNotice.Status.OPEN);
		closed.forEach(FactorPackNotice::closeAsWithdrawn);
		events.save(new FactorPackEvent(edition.getEditionId(), FactorPackEvent.Action.WITHDRAWN, actorId, actorEmail,
				trimmed + " " + closed.size() + (closed.size() == 1 ? " open notice was" : " open notices were")
						+ " closed."));
		packs.invalidateAfterCommit();
		return edition;
	}

	// --- reads --------------------------------------------------------------

	@Transactional(readOnly = true)
	public List<FactorPackChange> changeLog(String editionId) {
		return changes.findAllByEditionIdOrderByCodeAsc(editionId);
	}

	@Transactional(readOnly = true)
	public List<FactorPackEvent> trail(String editionId) {
		return events.findAllByEditionIdOrderByOccurredAtAsc(editionId);
	}

	// --- internals ----------------------------------------------------------

	private static void requireDraft(FactorPackEdition edition) {
		if (!edition.isMutable()) {
			throw new GhgRuleViolationException("'" + edition.getEditionId() + "' is already "
					+ edition.getStatus().name().toLowerCase(Locale.ROOT)
					+ ". An edition is published once; clone it into a new draft to correct a row.");
		}
	}

	/**
	 * The curator builds the draft and the approver checks it against the source
	 * document. They must be two different people, because an edition signed by
	 * one person is not a checked transcription.
	 */
	private static void requireSeparationOfDuties(FactorPackEdition edition, UUID approverUserId,
			String approverEmail) {
		var sameId = edition.getCuratorUserId() != null && edition.getCuratorUserId().equals(approverUserId);
		var sameEmail = edition.getCuratorEmail() != null && approverEmail != null
				&& edition.getCuratorEmail().equalsIgnoreCase(approverEmail);
		if (sameId || sameEmail) {
			throw new GhgFieldException("approver", "The approver must not be the curator. " + edition.getCuratorName()
					+ " built this draft, so somebody else checks it against the source document and publishes it.");
		}
	}

	private static String refusal(FactorPackEdition edition, List<FactorPackValidation.Finding> findings) {
		var rules = findings.stream()
			.map(FactorPackValidation.Finding::rule)
			.distinct()
			.sorted()
			.toList();
		return "'" + edition.getEditionId() + "' breaks " + findings.size()
				+ (findings.size() == 1 ? " publication rule" : " publication rules") + " across "
				+ rules.size() + (rules.size() == 1 ? " rule: " : " rules: ") + String.join(", ", rules)
				+ ". Each is a hard failure, never a warning, because a published edition is a citation. "
				+ "Read the validation report and correct the rows.";
	}

	private static String summary(List<FactorPackChange> log, FactorPackEdition predecessor) {
		var added = log.stream().filter(change -> change.getKind() == FactorPackChange.Kind.ADDED).count();
		var changed = log.stream().filter(change -> change.getKind() == FactorPackChange.Kind.CHANGED).count();
		var discontinued = log.stream()
			.filter(change -> change.getKind() == FactorPackChange.Kind.DISCONTINUED)
			.count();
		var unchanged = log.stream().filter(change -> change.getKind() == FactorPackChange.Kind.UNCHANGED).count();
		return (predecessor == null ? "First edition of the family. " : "Against " + predecessor.getEditionId() + ": ")
				+ added + " added, " + changed + " changed, " + discontinued + " discontinued, " + unchanged
				+ " unchanged.";
	}

	private static String sha256(byte[] bytes) {
		try {
			return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
		}
		catch (java.security.NoSuchAlgorithmException ex) {
			throw new IllegalStateException("SHA-256 is not available", ex);
		}
	}

	private static String plain(BigDecimal value) {
		return value == null ? "" : value.stripTrailingZeros().toPlainString();
	}

	private static String required(String field, String value, String message) {
		var trimmed = value == null ? "" : value.trim();
		if (trimmed.isEmpty()) {
			throw new GhgFieldException(field, message);
		}
		return trimmed;
	}

	private static String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		var trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
