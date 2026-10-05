package com.carbonos.ghg.internal;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One decision an import made on an emission source name the facility did not
 * have (spec 04.11): the name as typed, whether it was mapped to an existing
 * source or created, the source it resolved to, the rows it covered, the reason
 * and who decided. The record holds the source it ended with; this is how it got
 * there.
 */
@Entity
@Table(name = "ghg_import_decisions")
public class ImportDecision {

	public enum Kind {
		MAPPED, CREATED
	}

	@Id
	private UUID id;

	@Column(name = "batch_id", nullable = false)
	private UUID batchId;

	@Column(name = "facility_id", nullable = false)
	private UUID facilityId;

	@Column(name = "typed_name", nullable = false, length = 120)
	private String typedName;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 8)
	private Kind kind;

	@Column(name = "stream_id")
	private UUID streamId;

	// the row numbers, comma separated
	@Column(nullable = false, columnDefinition = "text")
	private String rows;

	@Column(length = 500)
	private String reason;

	@Column(name = "decided_by_user_id")
	private UUID decidedByUserId;

	@Column(name = "decided_by", nullable = false, length = 320)
	private String decidedBy;

	@CreationTimestamp
	@Column(name = "decided_at", nullable = false, updatable = false)
	private Instant decidedAt;

	protected ImportDecision() {
	}

	ImportDecision(UUID batchId, UUID facilityId, String typedName, Kind kind, UUID streamId, List<Integer> rows,
			String reason, UUID decidedByUserId, String decidedBy) {
		this.id = UUID.randomUUID();
		this.batchId = batchId;
		this.facilityId = facilityId;
		this.typedName = typedName;
		this.kind = kind;
		this.streamId = streamId;
		this.rows = rows.stream().map(String::valueOf).collect(Collectors.joining(","));
		this.reason = reason;
		this.decidedByUserId = decidedByUserId;
		this.decidedBy = decidedBy;
	}

	public UUID getId() {
		return id;
	}

	public UUID getBatchId() {
		return batchId;
	}

	public UUID getFacilityId() {
		return facilityId;
	}

	public String getTypedName() {
		return typedName;
	}

	public Kind getKind() {
		return kind;
	}

	public UUID getStreamId() {
		return streamId;
	}

	public List<Integer> getRows() {
		return rows.isBlank() ? List.of() : Arrays.stream(rows.split(",")).map(Integer::valueOf).toList();
	}

	public String getReason() {
		return reason;
	}

	public UUID getDecidedByUserId() {
		return decidedByUserId;
	}

	public String getDecidedBy() {
		return decidedBy;
	}

	public Instant getDecidedAt() {
		return decidedAt;
	}
}
