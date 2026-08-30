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
 * and activity assignments — never the facts themselves (spec 003).
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

	boolean covers(LocalDate date) {
		return !date.isBefore(periodStart) && !date.isAfter(periodEnd);
	}
}
