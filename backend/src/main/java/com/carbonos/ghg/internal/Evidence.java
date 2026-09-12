package com.carbonos.ghg.internal;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * A piece of evidence behind a fact or a contractual instrument (spec 04.4,
 * ISO 14064-3 sampling): a file in the object store or a link to a document
 * system, with who attached it and when. Lines snapshot the file names, so
 * the calculation file says what stood behind each figure.
 */
@Entity
@Table(name = "ghg_evidence")
public class Evidence {

	public enum Kind {
		FILE, LINK
	}

	@Id
	private UUID id;

	@Column(name = "activity_id")
	private UUID activityId;

	// the same column as a read-only association, so the source documents page can join the record and
	// its facility (spec 04.6)
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "activity_id", insertable = false, updatable = false)
	private ActivityRecord activity;

	@Column(name = "market_factor_id")
	private UUID marketFactorId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 6)
	private Kind kind;

	@Column(nullable = false, length = 255)
	private String name;

	@Column(length = 1000)
	private String url;

	@Column(name = "content_type", length = 120)
	private String contentType;

	@Column(name = "size_bytes")
	private Long sizeBytes;

	@Column(name = "storage_key", length = 255)
	private String storageKey;

	@Column(name = "uploaded_by", nullable = false, length = 320)
	private String uploadedBy;

	@CreationTimestamp
	@Column(name = "uploaded_at", nullable = false, updatable = false)
	private Instant uploadedAt;

	protected Evidence() {
	}

	static Evidence file(UUID activityId, UUID marketFactorId, String name, String contentType, long sizeBytes,
			String uploadedBy) {
		var evidence = new Evidence();
		evidence.id = UUID.randomUUID();
		evidence.activityId = activityId;
		evidence.marketFactorId = marketFactorId;
		evidence.kind = Kind.FILE;
		evidence.name = name;
		evidence.contentType = contentType;
		evidence.sizeBytes = sizeBytes;
		evidence.storageKey = "ghg/evidence/" + evidence.id;
		evidence.uploadedBy = uploadedBy;
		return evidence;
	}

	static Evidence link(UUID activityId, UUID marketFactorId, String name, String url, String uploadedBy) {
		var evidence = new Evidence();
		evidence.id = UUID.randomUUID();
		evidence.activityId = activityId;
		evidence.marketFactorId = marketFactorId;
		evidence.kind = Kind.LINK;
		evidence.name = name;
		evidence.url = url;
		evidence.uploadedBy = uploadedBy;
		return evidence;
	}

	public UUID getId() {
		return id;
	}

	public UUID getActivityId() {
		return activityId;
	}

	/** The record the evidence belongs to, or null for an instrument's evidence. */
	public ActivityRecord getActivity() {
		return activity;
	}

	public UUID getMarketFactorId() {
		return marketFactorId;
	}

	public Kind getKind() {
		return kind;
	}

	public String getName() {
		return name;
	}

	public String getUrl() {
		return url;
	}

	public String getContentType() {
		return contentType;
	}

	public Long getSizeBytes() {
		return sizeBytes;
	}

	public String getStorageKey() {
		return storageKey;
	}

	public String getUploadedBy() {
		return uploadedBy;
	}

	public Instant getUploadedAt() {
		return uploadedAt;
	}
}
