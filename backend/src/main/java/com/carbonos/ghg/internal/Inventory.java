package com.carbonos.ghg.internal;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

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
 * A GHG inventory: an accounting view over the organization's activity facts.
 * It owns the reporting period, consolidation approach, boundary treatments,
 * and activity assignments — never the facts themselves (spec 05).
 */
@Entity
@Table(name = "ghg_inventories")
public class Inventory {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "organization_id", nullable = false)
	private Organization organization;

	@Column(nullable = false, length = 120)
	private String name;

	@Column(name = "period_start", nullable = false)
	private LocalDate periodStart;

	@Column(name = "period_end", nullable = false)
	private LocalDate periodEnd;

	@Column(length = 255)
	private String purpose;

	@Column(name = "base_year")
	private Integer baseYear;

	@Enumerated(EnumType.STRING)
	@Column(name = "consolidation_approach", nullable = false, length = 30)
	private ConsolidationApproach consolidationApproach;

	@Column(name = "final_run_id")
	private UUID finalRunId;

	@Enumerated(EnumType.STRING)
	@Column(name = "boundary_status", nullable = false, length = 20)
	private BoundaryStatus boundaryStatus;

	// plain columns, like finalRunId, so responses never lazy-load (spec 03)
	@Column(name = "current_boundary_version_id")
	private UUID currentBoundaryVersionId;

	@Column(name = "current_boundary_version_no")
	private Integer currentBoundaryVersionNo;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected Inventory() {
	}

	Inventory(Organization organization, String name, LocalDate periodStart, LocalDate periodEnd, String purpose,
			Integer baseYear, ConsolidationApproach consolidationApproach) {
		this.id = UUID.randomUUID();
		this.organization = organization;
		this.name = name;
		this.periodStart = periodStart;
		this.periodEnd = periodEnd;
		this.purpose = purpose;
		this.baseYear = baseYear;
		this.consolidationApproach = consolidationApproach;
		this.boundaryStatus = BoundaryStatus.DRAFT;
	}

	public UUID getId() {
		return id;
	}

	public Organization getOrganization() {
		return organization;
	}

	public String getName() {
		return name;
	}

	public LocalDate getPeriodStart() {
		return periodStart;
	}

	public LocalDate getPeriodEnd() {
		return periodEnd;
	}

	public String getPurpose() {
		return purpose;
	}

	public Integer getBaseYear() {
		return baseYear;
	}

	public ConsolidationApproach getConsolidationApproach() {
		return consolidationApproach;
	}

	public UUID getFinalRunId() {
		return finalRunId;
	}

	public BoundaryStatus getBoundaryStatus() {
		return boundaryStatus;
	}

	public boolean isBoundaryFrozen() {
		return boundaryStatus == BoundaryStatus.FROZEN;
	}

	public UUID getCurrentBoundaryVersionId() {
		return currentBoundaryVersionId;
	}

	public Integer getCurrentBoundaryVersionNo() {
		return currentBoundaryVersionNo;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	void update(String name, LocalDate periodStart, LocalDate periodEnd, String purpose, Integer baseYear,
			ConsolidationApproach consolidationApproach) {
		this.name = name;
		this.periodStart = periodStart;
		this.periodEnd = periodEnd;
		this.purpose = purpose;
		this.baseYear = baseYear;
		this.consolidationApproach = consolidationApproach;
	}

	void setFinalRunId(UUID finalRunId) {
		this.finalRunId = finalRunId;
	}

	/** Records a freshly cut version as the boundary's current one and freezes it. */
	void freezeBoundary(BoundaryVersion version) {
		this.boundaryStatus = BoundaryStatus.FROZEN;
		this.currentBoundaryVersionId = version.getId();
		this.currentBoundaryVersionNo = version.getVersionNo();
	}

	/** Reopens the boundary for editing. The latest version is kept for reference. */
	void reopenBoundary() {
		this.boundaryStatus = BoundaryStatus.DRAFT;
	}

	boolean covers(LocalDate date) {
		return !date.isBefore(periodStart) && !date.isAfter(periodEnd);
	}
}
