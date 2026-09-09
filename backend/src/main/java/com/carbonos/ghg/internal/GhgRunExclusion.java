package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

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
 * An assignment a run did not calculate, snapshotted with the activity's facts
 * and the documented reason (spec 05.1), so the exclusions a report lists can
 * be reconstructed for any past run (Chapter 9).
 */
@Entity
@Table(name = "ghg_run_exclusions")
public class GhgRunExclusion {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "run_id", nullable = false)
	private GhgRun run;

	@Column(name = "activity_id", nullable = false)
	private UUID activityId;

	@Column(name = "facility_name", nullable = false, length = 120)
	private String facilityName;

	@Column(name = "activity_type", nullable = false, length = 120)
	private String activityType;

	@Column(nullable = false, precision = 14, scale = 3)
	private BigDecimal quantity;

	@Column(nullable = false, length = 30)
	private String unit;

	@Column(name = "period_start", nullable = false)
	private LocalDate periodStart;

	@Column(name = "period_end", nullable = false)
	private LocalDate periodEnd;

	@Enumerated(EnumType.STRING)
	@Column(name = "exclusion_reason", nullable = false, length = 40)
	private ExclusionReason exclusionReason;

	@Column(name = "exclusion_detail", length = 255)
	private String exclusionDetail;

	@Column(name = "exclusion_justification", length = 500)
	private String exclusionJustification;

	@Column(name = "estimated_kg_co2e", precision = 18, scale = 3)
	private BigDecimal estimatedKgCo2e;

	protected GhgRunExclusion() {
	}

	GhgRunExclusion(GhgRun run, InventoryAssignment assignment) {
		var activity = assignment.getActivity();
		this.id = UUID.randomUUID();
		this.run = run;
		this.activityId = activity.getId();
		this.facilityName = activity.getFacility().getName();
		this.activityType = activity.getActivityType();
		this.quantity = activity.getQuantity();
		this.unit = activity.getUnit();
		this.periodStart = activity.getPeriodStart();
		this.periodEnd = activity.getPeriodEnd();
		this.exclusionReason = assignment.getExclusionReason();
		this.exclusionDetail = assignment.getExclusionDetail();
		this.exclusionJustification = assignment.getExclusionJustification();
		this.estimatedKgCo2e = assignment.getEstimatedKgCo2e();
	}

	public UUID getId() {
		return id;
	}

	public UUID getActivityId() {
		return activityId;
	}

	public String getFacilityName() {
		return facilityName;
	}

	public String getActivityType() {
		return activityType;
	}

	public BigDecimal getQuantity() {
		return quantity;
	}

	public String getUnit() {
		return unit;
	}

	public LocalDate getPeriodStart() {
		return periodStart;
	}

	public LocalDate getPeriodEnd() {
		return periodEnd;
	}

	public ExclusionReason getExclusionReason() {
		return exclusionReason;
	}

	public String getExclusionDetail() {
		return exclusionDetail;
	}

	public String getExclusionJustification() {
		return exclusionJustification;
	}

	public BigDecimal getEstimatedKgCo2e() {
		return estimatedKgCo2e;
	}
}
