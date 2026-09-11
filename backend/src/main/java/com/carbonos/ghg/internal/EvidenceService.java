package com.carbonos.ghg.internal;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.carbonos.media.MediaStorage;
import com.carbonos.media.MediaStorageException;
import com.carbonos.media.StoredMedia;

/**
 * Evidence behind facts and contractual instruments (spec 04.4): files kept
 * in the {@code media} module's object store under {@code ghg/evidence/<id>},
 * or links to a document system. Tenant-checked through the record or the
 * instrument the evidence belongs to.
 */
@Service
@Transactional
public class EvidenceService {

	static final long MAX_BYTES = 20L * 1024 * 1024;

	// content types by extension for formats that cannot be sniffed (spreadsheets, text)
	private static final Map<String, String> BY_EXTENSION = Map.of("csv", "text/csv", "txt", "text/plain",
			"xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xls",
			"application/vnd.ms-excel", "docx",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document");

	private final EvidenceRepository evidence;
	private final ActivityRecordRepository activities;
	private final MarketFactorRepository marketFactors;
	private final OrganizationRepository organizations;
	private final GhgRunLineRepository runLines;
	private final ImportBatchRepository batches;
	private final MediaStorage media;
	private final GhgAccess access;

	EvidenceService(EvidenceRepository evidence, ActivityRecordRepository activities,
			MarketFactorRepository marketFactors, OrganizationRepository organizations, GhgRunLineRepository runLines,
			ImportBatchRepository batches, MediaStorage media, GhgAccess access) {
		this.evidence = evidence;
		this.activities = activities;
		this.marketFactors = marketFactors;
		this.organizations = organizations;
		this.runLines = runLines;
		this.batches = batches;
		this.media = media;
		this.access = access;
	}

	/** Which documents the source documents page lists (spec 04.6). */
	public enum DocumentFilter {
		ALL, LINK_ONLY, ORPHANED
	}

	/** One page of an organization's record evidence, newest first. */
	public record DocumentPage(List<Evidence> items, int page, int size, long total) {
	}

	/**
	 * The organization's record evidence as one register (spec 04.6): searched
	 * by document name, activity, facility or reference, filtered to links
	 * (link rot) or to documents whose record was removed (orphans).
	 */
	@Transactional(readOnly = true)
	public DocumentPage pageOfOrganization(UUID organizationId, String q, UUID facilityId, DocumentFilter filter,
			int page, int size) {
		var organization = organizations.findById(organizationId)
			.orElseThrow(() -> GhgNotFoundException.organization(organizationId));
		access.check(organization);
		var like = q == null || q.isBlank() ? null : "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
		Specification<Evidence> spec = (root, cq, cb) -> {
			var activity = root.join("activity");
			var facility = activity.join("facility");
			var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
			predicates.add(cb.equal(activity.get("organizationId"), organizationId));
			if (facilityId != null) {
				predicates.add(cb.equal(facility.get("id"), facilityId));
			}
			if (filter == DocumentFilter.LINK_ONLY) {
				predicates.add(cb.equal(root.get("kind"), Evidence.Kind.LINK));
			}
			if (filter == DocumentFilter.ORPHANED) {
				predicates.add(cb.isNotNull(activity.get("deletedAt")));
			}
			if (like != null) {
				predicates.add(cb.or(cb.like(cb.lower(root.get("name")), like),
						cb.like(cb.lower(activity.get("activityType")), like),
						cb.like(cb.lower(facility.get("name")), like),
						cb.like(cb.lower(cb.coalesce(activity.get("evidenceRef"), "")), like)));
			}
			return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
		};
		var bounded = Math.max(1, Math.min(size, 200));
		var found = evidence.findAll(spec, PageRequest.of(Math.max(0, page), bounded,
				Sort.by(Sort.Direction.DESC, "uploadedAt").and(Sort.by(Sort.Direction.DESC, "id"))));
		for (var item : found.getContent()) {
			// the record, its facility and stream render outside the transaction: initialize them here
			item.getActivity().getFacility().getName();
			if (item.getActivity().getStream() != null) {
				item.getActivity().getStream().getName();
			}
		}
		return new DocumentPage(found.getContent(), found.getNumber(), bounded, found.getTotalElements());
	}

	/** The files each import came from (spec 04.6), newest first. */
	@Transactional(readOnly = true)
	public List<ImportBatch> importBatches(UUID organizationId) {
		var organization = organizations.findById(organizationId)
			.orElseThrow(() -> GhgNotFoundException.organization(organizationId));
		access.check(organization);
		return batches.findAllByOrganizationIdOrderByImportedAtDesc(organizationId);
	}

	/** The CSV as it was uploaded, for download. */
	@Transactional(readOnly = true)
	public ImportDownload openImport(UUID batchId) {
		var batch = batches.findById(batchId).orElseThrow(() -> GhgNotFoundException.importBatch(batchId));
		access.check(organizations.findById(batch.getOrganizationId())
			.orElseThrow(() -> GhgNotFoundException.organization(batch.getOrganizationId())));
		return new ImportDownload(batch, media.get(batch.getStorageKey()));
	}

	public record ImportDownload(ImportBatch batch, StoredMedia media) {
	}

	/**
	 * The evidence index for a verifier's pack (spec 04.6): every document of
	 * every live record, one row each, with the record it stands behind.
	 */
	@Transactional(readOnly = true)
	public String index(UUID organizationId) {
		var organization = organizations.findById(organizationId)
			.orElseThrow(() -> GhgNotFoundException.organization(organizationId));
		access.check(organization);
		Specification<Evidence> live = (root, cq, cb) -> {
			var activity = root.join("activity");
			return cb.and(cb.equal(activity.get("organizationId"), organizationId), cb.isNull(activity.get("deletedAt")));
		};
		var out = new StringBuilder(
				"record_ref,activity_type,facility,period_start,period_end,evidence_ref,document,kind,url,content_type,size_bytes,uploaded_by,uploaded_at\r\n");
		for (var item : evidence.findAll(live, Sort.by("activity.recordNo", "uploadedAt"))) {
			var activity = item.getActivity();
			for (var value : java.util.Arrays.asList(activity.getRecordRef(), activity.getActivityType(),
					activity.getFacility().getName(), activity.getPeriodStart(), activity.getPeriodEnd(),
					activity.getEvidenceRef(), item.getName(), item.getKind(), item.getUrl(), item.getContentType(),
					item.getSizeBytes(), item.getUploadedBy(), item.getUploadedAt())) {
				out.append(csv(value)).append(',');
			}
			out.setLength(out.length() - 1);
			out.append("\r\n");
		}
		return out.toString();
	}

	private static String csv(Object value) {
		if (value == null) {
			return "";
		}
		var text = value.toString();
		if (text.contains(",") || text.contains("\"") || text.contains("\n") || text.contains("\r")) {
			return "\"" + text.replace("\"", "\"\"") + "\"";
		}
		return text;
	}

	/** What the evidence belongs to: a record or an instrument. */
	public record Owner(UUID activityId, UUID marketFactorId) {
		public static Owner activity(UUID id) {
			return new Owner(id, null);
		}

		public static Owner marketFactor(UUID id) {
			return new Owner(null, id);
		}
	}

	@Transactional(readOnly = true)
	public List<Evidence> list(Owner owner) {
		check(owner);
		return owner.activityId() != null ? evidence.findAllByActivityIdOrderByUploadedAtAsc(owner.activityId())
				: evidence.findAllByMarketFactorIdOrderByUploadedAtAsc(owner.marketFactorId());
	}

	public Evidence attachFile(Owner owner, MultipartFile file) {
		checkWrite(owner);
		if (file.isEmpty()) {
			throw new GhgFieldException("file", "Choose a file to attach.");
		}
		if (file.getSize() > MAX_BYTES) {
			throw new GhgFieldException("file", "The file is larger than 20 MB.");
		}
		var name = file.getOriginalFilename() == null || file.getOriginalFilename().isBlank() ? "evidence"
				: file.getOriginalFilename().replaceAll("[\\\\/]", "_");
		var contentType = contentTypeOf(file, name);
		var stored = evidence.save(Evidence.file(owner.activityId(), owner.marketFactorId(), name, contentType,
				file.getSize(), access.currentUserEmail()));
		// store after the row is fixed: if the put fails the transaction rolls back and nothing points at a
		// missing object
		try (InputStream in = file.getInputStream()) {
			media.put(stored.getStorageKey(), in, file.getSize(), contentType);
		}
		catch (IOException ex) {
			throw new MediaStorageException("Failed to read the uploaded file", ex);
		}
		return stored;
	}

	public Evidence attachLink(Owner owner, String name, String url) {
		checkWrite(owner);
		var trimmedUrl = url == null ? "" : url.trim();
		if (!trimmedUrl.startsWith("https://") && !trimmedUrl.startsWith("http://")) {
			throw new GhgFieldException("url", "A link starts with https:// or http://.");
		}
		var trimmedName = name == null || name.isBlank() ? trimmedUrl : name.trim();
		return evidence.save(Evidence.link(owner.activityId(), owner.marketFactorId(), trimmedName, trimmedUrl,
				access.currentUserEmail()));
	}

	/** The file's bytes, for download; a link has none (409). */
	@Transactional(readOnly = true)
	public Download open(UUID id) {
		var item = get(id);
		if (item.getKind() != Evidence.Kind.FILE) {
			throw new GhgRuleViolationException("This evidence is a link, not a file: open " + item.getUrl() + ".");
		}
		return new Download(item, media.get(item.getStorageKey()));
	}

	public record Download(Evidence evidence, StoredMedia media) {
	}

	public void delete(UUID id) {
		var item = get(id);
		checkWrite(new Owner(item.getActivityId(), item.getMarketFactorId()));
		// spec 04.6: a run snapshotted the record with this document behind it; the document stays on file
		if (item.getActivityId() != null && runLines.existsByActivityId(item.getActivityId())) {
			throw new GhgRuleViolationException(
					"A run has calculated this record; its evidence stays on file so the run remains traceable.");
		}
		evidence.delete(item);
		if (item.getStorageKey() != null) {
			media.delete(item.getStorageKey());
		}
	}

	private Evidence get(UUID id) {
		var item = evidence.findById(id).orElseThrow(() -> GhgNotFoundException.evidence(id));
		check(new Owner(item.getActivityId(), item.getMarketFactorId()));
		return item;
	}

	private Organization organizationOf(Owner owner) {
		if (owner.activityId() != null) {
			return activities.findById(owner.activityId())
				.orElseThrow(() -> GhgNotFoundException.activity(owner.activityId()))
				.getFacility()
				.getOrganization();
		}
		return marketFactors.findById(owner.marketFactorId())
			.orElseThrow(() -> GhgNotFoundException.marketFactor(owner.marketFactorId()))
			.getInventory()
			.getOrganization();
	}

	private void check(Owner owner) {
		access.check(organizationOf(owner));
	}

	private void checkWrite(Owner owner) {
		access.checkWrite(organizationOf(owner));
	}

	/** The server-chosen content type: sniffed for images and PDF, by extension for spreadsheets and text. */
	private static String contentTypeOf(MultipartFile file, String name) {
		try (InputStream in = file.getInputStream()) {
			var prefix = in.readNBytes(12);
			if (startsWith(prefix, 0x25, 0x50, 0x44, 0x46)) {
				return "application/pdf";
			}
			if (startsWith(prefix, 0x89, 0x50, 0x4E, 0x47)) {
				return "image/png";
			}
			if (startsWith(prefix, 0xFF, 0xD8, 0xFF)) {
				return "image/jpeg";
			}
			if (startsWith(prefix, 0x52, 0x49, 0x46, 0x46) && prefix.length >= 12 && prefix[8] == 'W'
					&& prefix[9] == 'E' && prefix[10] == 'B' && prefix[11] == 'P') {
				return "image/webp";
			}
		}
		catch (IOException ex) {
			throw new MediaStorageException("Failed to read the uploaded file", ex);
		}
		var dot = name.lastIndexOf('.');
		var extension = dot < 0 ? "" : name.substring(dot + 1).toLowerCase(Locale.ROOT);
		var known = BY_EXTENSION.get(extension);
		if (known == null) {
			throw new GhgFieldException("file",
					"Attach a PDF, an image (PNG, JPEG, WebP), a spreadsheet (XLSX, XLS, CSV) or a text file.");
		}
		return known;
	}

	private static boolean startsWith(byte[] bytes, int... expected) {
		if (bytes.length < expected.length) {
			return false;
		}
		for (int i = 0; i < expected.length; i++) {
			if ((bytes[i] & 0xFF) != expected[i]) {
				return false;
			}
		}
		return true;
	}
}
