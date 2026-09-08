package com.carbonos.ghg.internal;

import java.math.BigDecimal;
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
 * One candidate recalculation of the base year (spec 06): what triggered it,
 * how much of the base-year emissions it affects, and the accountant's
 * decision, either a recalculated base (a run of the base-year inventory) or
 * a documented refusal.
 */
@Entity
@Table(name = "ghg_base_year_recalculations")
public class BaseYearRecalculation {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "base_year_id", nullable = false)
	private BaseYear baseYear;

	@Enumerated(EnumType.STRING)
	@Column(name = "trigger_type", nullable = false, length = 30)
	private RecalculationTrigger triggerType;

	@Column(nullable = false, length = 500)
	private String reason;

	@Column(name = "triggering_inventory_id")
	private UUID triggeringInventoryId;

	@Column(name = "boundary_version_id")
	private UUID boundaryVersionId;

	@Column(name = "boundary_version_no")
	private Integer boundaryVersionNo;

	@Column(name = "affected_percent", precision = 7, scale = 2)
	private BigDecimal affectedPercent;

	@Column(name = "above_threshold", nullable = false)
	private boolean aboveThreshold;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private RecalculationStatus status;

	@Column(name = "run_id")
	private UUID runId;

	@Column(name = "decision_note", length = 500)
	private String decisionNote;

	@Column(name = "decided_by", length = 320)
	private String decidedBy;

	@Column(name = "decided_at")
	private Instant decidedAt;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected BaseYearRecalculation() {
	}

	BaseYearRecalculation(BaseYear baseYear, RecalculationTrigger triggerType, String reason,
			Inventory triggeringInventory, BoundaryVersion version, BigDecimal affectedPercent,
			boolean aboveThreshold) {
		this.id = UUID.randomUUID();
		this.baseYear = baseYear;
		this.triggerType = triggerType;
		this.reason = reason;
		this.triggeringInventoryId = triggeringInventory == null ? null : triggeringInventory.getId();
		this.boundaryVersionId = version == null ? null : version.getId();
		this.boundaryVersionNo = version == null ? null : version.getVersionNo();
		this.affectedPercent = affectedPercent;
		this.aboveThreshold = aboveThreshold;
		this.status = RecalculationStatus.FLAGGED;
	}

	void decide(RecalculationStatus decision, UUID runId, String note, String decidedBy) {
		this.status = decision;
		this.runId = runId;
		this.decisionNote = note;
		this.decidedBy = decidedBy;
		this.decidedAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public BaseYear getBaseYear() {
		return baseYear;
	}

	public RecalculationTrigger getTriggerType() {
		return triggerType;
	}

	public String getReason() {
		return reason;
	}

	public UUID getTriggeringInventoryId() {
		return triggeringInventoryId;
	}

	public UUID getBoundaryVersionId() {
		return boundaryVersionId;
	}

	public Integer getBoundaryVersionNo() {
		return boundaryVersionNo;
	}

	public BigDecimal getAffectedPercent() {
		return affectedPercent;
	}

	public boolean isAboveThreshold() {
		return aboveThreshold;
	}

	public RecalculationStatus getStatus() {
		return status;
	}

	public UUID getRunId() {
		return runId;
	}

	public String getDecisionNote() {
		return decisionNote;
	}

	public String getDecidedBy() {
		return decidedBy;
	}

	public Instant getDecidedAt() {
		return decidedAt;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
