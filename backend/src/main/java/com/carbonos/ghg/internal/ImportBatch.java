package com.carbonos.ghg.internal;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One CSV import (spec 04.6): the file as uploaded, kept in the object store
 * with its digest, so every imported record traces back to a row of a
 * document a verifier can open (ISO 14064-1 section 8.3).
 */
@Entity
@Table(name = "ghg_import_batches")
public class ImportBatch {

	@Id
	private UUID id;

	@Column(name = "organization_id", nullable = false)
	private UUID organizationId;

	@Column(name = "file_name", nullable = false, length = 255)
	private String fileName;

	@Column(nullable = false, length = 64)
	private String sha256;

	@Column(name = "row_count", nullable = false)
	private int rowCount;

	@Column(name = "size_bytes", nullable = false)
	private long sizeBytes;

	@Column(name = "storage_key", nullable = false, length = 255)
	private String storageKey;

	@Column(name = "imported_by", nullable = false, length = 320)
	private String importedBy;

	@CreationTimestamp
	@Column(name = "imported_at", nullable = false, updatable = false)
	private Instant importedAt;

	protected ImportBatch() {
	}

	ImportBatch(UUID organizationId, String fileName, String sha256, int rowCount, long sizeBytes, String importedBy) {
		this.id = UUID.randomUUID();
		this.organizationId = organizationId;
		this.fileName = fileName;
		this.sha256 = sha256;
		this.rowCount = rowCount;
		this.sizeBytes = sizeBytes;
		this.storageKey = "ghg/imports/" + this.id;
		this.importedBy = importedBy;
	}

	public UUID getId() {
		return id;
	}

	public UUID getOrganizationId() {
		return organizationId;
	}

	public String getFileName() {
		return fileName;
	}

	public String getSha256() {
		return sha256;
	}

	public int getRowCount() {
		return rowCount;
	}

	public long getSizeBytes() {
		return sizeBytes;
	}

	public String getStorageKey() {
		return storageKey;
	}

	public String getImportedBy() {
		return importedBy;
	}

	public Instant getImportedAt() {
		return importedAt;
	}
}
