package com.carbonos.ghg.internal;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

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
	private final MediaStorage media;
	private final GhgAccess access;

	EvidenceService(EvidenceRepository evidence, ActivityRecordRepository activities,
			MarketFactorRepository marketFactors, MediaStorage media, GhgAccess access) {
		this.evidence = evidence;
		this.activities = activities;
		this.marketFactors = marketFactors;
		this.media = media;
		this.access = access;
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
