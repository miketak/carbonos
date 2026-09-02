package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

/**
 * An immutable, reproducible snapshot of one inventory's accounting view at
 * the moment it was calculated (spec 003, invariant 3). Lines denormalize
 * every input, so later edits to facts, boundary, or classification never
 * rewrite a past run. Recalculation creates a new run.
 */
@Entity
@Table(name = "ghg_runs")
public class GhgRun {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "inventory_id", nullable = false)
	private Inventory inventory;

	@Column(nullable = false, length = 120)
	private String label;

	@Column(name = "period_start", nullable = false)
	private LocalDate periodStart;

	@Column(name = "period_end", nullable = false)
	private LocalDate periodEnd;

	@Enumerated(EnumType.STRING)
	@Column(name = "consolidation_approach", nullable = false, length = 30)
	private ConsolidationApproach consolidationApproach;

	@Column(name = "activity_count", nullable = false)
	private int activityCount;

	@Column(name = "total_kg_co2e", nullable = false, precision = 18, scale = 3)
	private BigDecimal totalKgCo2e;

	@Column(name = "scope1_kg_co2e", nullable = false, precision = 18, scale = 3)
	private BigDecimal scope1KgCo2e;

	@Column(name = "scope2_kg_co2e", nullable = false, precision = 18, scale = 3)
	private BigDecimal scope2KgCo2e;

	@Column(name = "scope3_kg_co2e", nullable = false, precision = 18, scale = 3)
	private BigDecimal scope3KgCo2e;

	// the boundary version the shares came from; null for runs older than spec 007
	@Column(name = "boundary_version_id")
	private UUID boundaryVersionId;

	@Column(name = "boundary_version_no")
	private Integer boundaryVersionNo;

	@OneToMany(mappedBy = "run", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("kgCo2e DESC")
	private List<GhgRunLine> lines = new ArrayList<>();

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected GhgRun() {
	}

	GhgRun(Inventory inventory, String label) {
		this.id = UUID.randomUUID();
		this.inventory = inventory;
		this.label = label;
		this.periodStart = inventory.getPeriodStart();
		this.periodEnd = inventory.getPeriodEnd();
		this.consolidationApproach = inventory.getConsolidationApproach();
		this.boundaryVersionId = inventory.getCurrentBoundaryVersionId();
		this.boundaryVersionNo = inventory.getCurrentBoundaryVersionNo();
		this.activityCount = 0;
		this.totalKgCo2e = BigDecimal.ZERO;
		this.scope1KgCo2e = BigDecimal.ZERO;
		this.scope2KgCo2e = BigDecimal.ZERO;
		this.scope3KgCo2e = BigDecimal.ZERO;
	}

	void addLine(GhgRunLine line) {
		lines.add(line);
		activityCount++;
		totalKgCo2e = totalKgCo2e.add(line.getKgCo2e());
		switch (line.getScope()) {
			case SCOPE_1 -> scope1KgCo2e = scope1KgCo2e.add(line.getKgCo2e());
			case SCOPE_2 -> scope2KgCo2e = scope2KgCo2e.add(line.getKgCo2e());
			case SCOPE_3 -> scope3KgCo2e = scope3KgCo2e.add(line.getKgCo2e());
		}
	}

	public UUID getId() {
		return id;
	}

	public Inventory getInventory() {
		return inventory;
	}

	public String getLabel() {
		return label;
	}

	public LocalDate getPeriodStart() {
		return periodStart;
	}

	public LocalDate getPeriodEnd() {
		return periodEnd;
	}

	public ConsolidationApproach getConsolidationApproach() {
		return consolidationApproach;
	}

	public int getActivityCount() {
		return activityCount;
	}

	public BigDecimal getTotalKgCo2e() {
		return totalKgCo2e;
	}

	public BigDecimal getScope1KgCo2e() {
		return scope1KgCo2e;
	}

	public BigDecimal getScope2KgCo2e() {
		return scope2KgCo2e;
	}

	public BigDecimal getScope3KgCo2e() {
		return scope3KgCo2e;
	}

	public UUID getBoundaryVersionId() {
		return boundaryVersionId;
	}

	public Integer getBoundaryVersionNo() {
		return boundaryVersionNo;
	}

	public List<GhgRunLine> getLines() {
		return List.copyOf(lines);
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
