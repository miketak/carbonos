package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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
 * A GHG inventory: an accounting view over the organization's activity facts
 * for one reporting period under one consolidation approach. It owns the
 * boundary treatments and activity assignments, never the facts themselves
 * (spec 05), and has one lifecycle covering both halves (spec 05.1).
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

	@Enumerated(EnumType.STRING)
	@Column(name = "gwp_set", nullable = false, length = 5)
	private GwpSet gwpSet;

	// the operational boundary declaration (spec 07.1): scope 3 categories covered, as a comma list
	@Column(name = "scope3_categories")
	private String scope3Categories;

	@Column(name = "scope3_exclusions_rationale", length = 1000)
	private String scope3ExclusionsRationale;

	// Scope 2 Guidance (spec 07.2): whether an adjusted residual mix is available for the markets the
	// instruments sit in, and its factor when it is; null until the accountant says
	@Column(name = "residual_mix_available")
	private Boolean residualMixAvailable;

	@Column(name = "residual_mix_kg_co2e_per_kwh", precision = 12, scale = 6)
	private BigDecimal residualMixKgCo2ePerKwh;

	@Column(name = "final_run_id")
	private UUID finalRunId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private InventoryStatus status;

	@Column(name = "superseded_by_id")
	private UUID supersededById;

	@Column(name = "published_at")
	private Instant publishedAt;

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
			Integer baseYear, ConsolidationApproach consolidationApproach, GwpSet gwpSet) {
		this.id = UUID.randomUUID();
		this.organization = organization;
		this.name = name;
		this.periodStart = periodStart;
		this.periodEnd = periodEnd;
		this.purpose = purpose;
		this.baseYear = baseYear;
		this.consolidationApproach = consolidationApproach;
		this.gwpSet = gwpSet;
		this.status = InventoryStatus.DRAFT;
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

	public GwpSet getGwpSet() {
		return gwpSet;
	}

	public List<ActivityCategory> getScope3Categories() {
		if (scope3Categories == null || scope3Categories.isBlank()) {
			return List.of();
		}
		return Arrays.stream(scope3Categories.split(",")).map(String::trim).map(ActivityCategory::valueOf).toList();
	}

	public String getScope3ExclusionsRationale() {
		return scope3ExclusionsRationale;
	}

	public Boolean getResidualMixAvailable() {
		return residualMixAvailable;
	}

	public BigDecimal getResidualMixKgCo2ePerKwh() {
		return residualMixKgCo2ePerKwh;
	}

	void setResidualMix(Boolean available, BigDecimal kgCo2ePerKwh) {
		this.residualMixAvailable = available;
		this.residualMixKgCo2ePerKwh = Boolean.TRUE.equals(available) ? kgCo2ePerKwh : null;
	}

	public UUID getFinalRunId() {
		return finalRunId;
	}

	public InventoryStatus getStatus() {
		return status;
	}

	public boolean isEditable() {
		return status.isEditable();
	}

	public UUID getSupersededById() {
		return supersededById;
	}

	public Instant getPublishedAt() {
		return publishedAt;
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
			ConsolidationApproach consolidationApproach, GwpSet gwpSet) {
		this.name = name;
		this.periodStart = periodStart;
		this.periodEnd = periodEnd;
		this.purpose = purpose;
		this.baseYear = baseYear;
		this.consolidationApproach = consolidationApproach;
		this.gwpSet = gwpSet;
	}

	void setOperationalBoundary(List<ActivityCategory> scope3Categories, String exclusionsRationale) {
		this.scope3Categories = scope3Categories.isEmpty() ? null
				: scope3Categories.stream().distinct().map(Enum::name).collect(Collectors.joining(","));
		this.scope3ExclusionsRationale = exclusionsRationale;
	}

	/** Records a freshly cut version as the current one and freezes both halves of the view. */
	void freeze(BoundaryVersion version) {
		this.status = InventoryStatus.FROZEN;
		this.currentBoundaryVersionId = version.getId();
		this.currentBoundaryVersionNo = version.getVersionNo();
	}

	/** Reopens the inventory for editing. The latest version is kept for reference. */
	void reopen() {
		this.status = InventoryStatus.DRAFT;
	}

	void designateFinal(UUID runId) {
		this.finalRunId = runId;
		this.status = InventoryStatus.FINAL;
	}

	void withdrawFinal() {
		this.finalRunId = null;
		this.status = InventoryStatus.FROZEN;
	}

	void publish() {
		this.status = InventoryStatus.PUBLISHED;
		this.publishedAt = Instant.now();
	}

	void markSupersededBy(Inventory successor) {
		this.supersededById = successor.getId();
	}

	boolean covers(LocalDate date) {
		return !date.isBefore(periodStart) && !date.isAfter(periodEnd);
	}
}
