package com.carbonos.ghg.internal;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One dated release of a factor pack family (spec 02.5): {@code defra-2026},
 * {@code defra-2026.r2}. The edition, not the family, is the unit of vintage, so
 * a citation names one thing forever. It carries the publication it represents,
 * the date it applies from, and, once published, the evidence checksum and the
 * two people behind it.
 *
 * <p>The ten editions {@code V43} seeded read {@code SEED_UNCHECKED}: their
 * values were in production before the catalogue existed, so their checksum is
 * over the shipped JSON rather than the publication and no approver checked
 * them. An edition authored in the console can never carry that value, and the
 * publication gate of the console phase enforces the rest.
 */
@Entity
@Table(name = "ghg_factor_pack_editions")
public class FactorPackEdition {

	/** The provenance of the editions the seed created, which alone may publish without an approver. */
	public static final String SEED_UNCHECKED = "SEED_UNCHECKED";

	/** The provenance of every edition authored in the console: checked against the publication. */
	public static final String REVIEWED = "REVIEWED";

	@Id
	@Column(name = "edition_id", length = 60)
	private String editionId;

	@Column(name = "pack_key", nullable = false, length = 60)
	private String packKey;

	@Column(nullable = false, length = 200)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 12)
	private FactorPackStatus status;

	@Column(nullable = false, length = 500)
	private String source;

	@Column(name = "source_url", length = 500)
	private String sourceUrl;

	@Column(name = "publication_year")
	private Integer publicationYear;

	@Column(name = "gwp_basis", length = 20)
	private String gwpBasis;

	@Column(length = 200)
	private String license;

	// the date the tables were retrieved, as the publication states it
	@Column(length = 20)
	private String retrieved;

	@Column(length = 4000)
	private String notes;

	@Column(name = "applies_from")
	private LocalDate appliesFrom;

	@Column(name = "published_at")
	private Instant publishedAt;

	@Column(name = "source_document", length = 500)
	private String sourceDocument;

	@Column(name = "evidence_checksum", length = 64)
	private String evidenceChecksum;

	// the object key the source document is stored under in the media module
	@Column(name = "evidence_key", length = 200)
	private String evidenceKey;

	@Column(name = "evidence_name", length = 255)
	private String evidenceName;

	@Column(name = "evidence_size")
	private Long evidenceSize;

	@Column(name = "curator_user_id")
	private UUID curatorUserId;

	@Column(name = "curator_email", length = 320)
	private String curatorEmail;

	@Column(name = "curator_name", length = 200)
	private String curatorName;

	@Column(name = "approver_user_id")
	private UUID approverUserId;

	@Column(name = "approver_email", length = 320)
	private String approverEmail;

	@Column(name = "approver_name", length = 200)
	private String approverName;

	@Column(name = "provenance_review", nullable = false, length = 20)
	private String provenanceReview;

	@Column(name = "provenance_note", length = 1000)
	private String provenanceNote;

	// the edition this one supersedes: the predecessor the change log is computed against
	@Column(name = "supersedes_id", length = 60)
	private String supersedesId;

	@Column(nullable = false)
	private boolean erratum;

	@Column(name = "erratum_note", length = 1000)
	private String erratumNote;

	// recorded on the predecessor when an erratum supersedes it; its wrong values are never edited
	@Column(name = "error_note", length = 1000)
	private String errorNote;

	@Column(name = "withdrawn_at")
	private Instant withdrawnAt;

	@Column(name = "withdrawn_by", length = 320)
	private String withdrawnBy;

	@Column(name = "withdrawal_reason", length = 500)
	private String withdrawalReason;

	/** What a curator states when they create or edit a draft (spec 02.5). */
	public record Facts(String name, String source, String sourceUrl, Integer publicationYear, String gwpBasis,
			String license, String retrieved, String notes, LocalDate appliesFrom) {
	}

	protected FactorPackEdition() {
	}

	/**
	 * A new draft: invisible to organizations, rows mutable, the curator
	 * recorded with the email they hold now. {@code provenanceReview} is
	 * {@code REVIEWED}, never {@code SEED_UNCHECKED}: that value belongs to the
	 * ten editions {@code V43} seeded, so an edition authored in the console can
	 * never be published without an approver.
	 */
	FactorPackEdition(String editionId, String packKey, Facts facts, UUID curatorUserId, String curatorEmail,
			String curatorName) {
		this.editionId = editionId;
		this.packKey = packKey;
		this.status = FactorPackStatus.DRAFT;
		this.provenanceReview = REVIEWED;
		this.curatorUserId = curatorUserId;
		this.curatorEmail = curatorEmail;
		this.curatorName = curatorName;
		update(facts);
	}

	/** Applies a curator's edit. Only a draft ever reaches here; the service refuses the rest. */
	void update(Facts facts) {
		this.name = facts.name();
		this.source = facts.source();
		this.sourceUrl = facts.sourceUrl();
		this.publicationYear = facts.publicationYear();
		this.gwpBasis = facts.gwpBasis();
		this.license = facts.license();
		this.retrieved = facts.retrieved();
		this.notes = facts.notes();
		this.appliesFrom = facts.appliesFrom();
	}

	/** The facts a clone copies from its predecessor, so a new draft starts where the last edition left off. */
	Facts facts() {
		return new Facts(name, source, sourceUrl, publicationYear, gwpBasis, license, retrieved, notes, appliesFrom);
	}

	/** Whether the rows and metadata may still change: only a draft (spec 02.5). */
	public boolean isMutable() {
		return status == FactorPackStatus.DRAFT;
	}

	/**
	 * Records the source document a maintainer publishes against, with the
	 * SHA-256 of the bytes stored. A draft may replace it as often as it likes;
	 * publication is what freezes it.
	 */
	void attachEvidence(String key, String name, long size, String checksum) {
		this.evidenceKey = key;
		this.evidenceName = name;
		this.evidenceSize = size;
		this.evidenceChecksum = checksum;
	}

	/**
	 * Freezes the edition (spec 02.5): the moment, the approver who is not the
	 * curator, the source document checked against, the date it applies from,
	 * and the predecessor the change log was computed against. Nothing here
	 * changes again, because reports rest on it.
	 */
	void publish(UUID approverUserId, String approverEmail, String approverName, String sourceDocument,
			LocalDate appliesFrom, String predecessorId, boolean erratum, String erratumNote) {
		this.status = FactorPackStatus.PUBLISHED;
		this.publishedAt = Instant.now();
		this.approverUserId = approverUserId;
		this.approverEmail = approverEmail;
		this.approverName = approverName;
		this.sourceDocument = sourceDocument;
		this.appliesFrom = appliesFrom;
		this.supersedesId = predecessorId;
		this.erratum = erratum;
		this.erratumNote = erratumNote;
	}

	/**
	 * A successor was published. The values stay exactly as they are: an
	 * erratum's predecessor records the note that it contains an error rather
	 * than having the error corrected in place, because reports already rest on
	 * the wrong figure.
	 */
	void supersede(String errorNote) {
		this.status = FactorPackStatus.SUPERSEDED;
		if (errorNote != null) {
			this.errorNote = errorNote;
		}
	}

	/** Leaves the import list with a reason. Rows organizations hold stay as they are. */
	void withdraw(String reason, String withdrawnBy) {
		this.status = FactorPackStatus.WITHDRAWN;
		this.withdrawnAt = Instant.now();
		this.withdrawnBy = withdrawnBy;
		this.withdrawalReason = reason;
	}

	/** The set the gas split reconciles under, AR5 where the edition names none. */
	public GwpSet gwp() {
		if (gwpBasis != null) {
			for (var set : GwpSet.values()) {
				if (set.name().equalsIgnoreCase(gwpBasis.trim())) {
					return set;
				}
			}
		}
		return GwpSet.AR5;
	}

	public String getEditionId() {
		return editionId;
	}

	public String getPackKey() {
		return packKey;
	}

	public String getName() {
		return name;
	}

	public FactorPackStatus getStatus() {
		return status;
	}

	public String getSource() {
		return source;
	}

	public String getSourceUrl() {
		return sourceUrl;
	}

	public Integer getPublicationYear() {
		return publicationYear;
	}

	public String getGwpBasis() {
		return gwpBasis;
	}

	public String getLicense() {
		return license;
	}

	public String getRetrieved() {
		return retrieved;
	}

	public String getNotes() {
		return notes;
	}

	public LocalDate getAppliesFrom() {
		return appliesFrom;
	}

	public Instant getPublishedAt() {
		return publishedAt;
	}

	public String getSourceDocument() {
		return sourceDocument;
	}

	public String getEvidenceChecksum() {
		return evidenceChecksum;
	}

	public String getEvidenceKey() {
		return evidenceKey;
	}

	public String getEvidenceName() {
		return evidenceName;
	}

	public Long getEvidenceSize() {
		return evidenceSize;
	}

	/** The predecessor the change log was computed against, or null for the first edition of a family. */
	public String getSupersedesId() {
		return supersedesId;
	}

	/** Whether this edition corrects a transcription error in its predecessor (spec 02.5). */
	public boolean isErratum() {
		return erratum;
	}

	public String getErratumNote() {
		return erratumNote;
	}

	/** Recorded on a superseded edition when the erratum after it named the error. */
	public String getErrorNote() {
		return errorNote;
	}

	public Instant getWithdrawnAt() {
		return withdrawnAt;
	}

	public String getWithdrawnBy() {
		return withdrawnBy;
	}

	public String getWithdrawalReason() {
		return withdrawalReason;
	}

	public UUID getCuratorUserId() {
		return curatorUserId;
	}

	public String getCuratorEmail() {
		return curatorEmail;
	}

	public String getCuratorName() {
		return curatorName;
	}

	public UUID getApproverUserId() {
		return approverUserId;
	}

	public String getApproverEmail() {
		return approverEmail;
	}

	public String getApproverName() {
		return approverName;
	}

	/** {@code REVIEWED}, or {@code SEED_UNCHECKED} for one of the ten the seed created. */
	public String getProvenanceReview() {
		return provenanceReview;
	}

	public String getProvenanceNote() {
		return provenanceNote;
	}
}
