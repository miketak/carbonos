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
 * An immutable inventory calculation: the roll-up of an organization's
 * activity data over a reporting period at the moment the run executed. Lines
 * snapshot every input, so later edits to activities, facilities, or the
 * consolidation approach never rewrite a past run.
 */
@Entity
@Table(name = "ghg_runs")
public class GhgRun {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "organization_id", nullable = false)
	private Organization organization;

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

	@OneToMany(mappedBy = "run", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("kgCo2e DESC")
	private List<GhgRunLine> lines = new ArrayList<>();

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected GhgRun() {
	}

	GhgRun(Organization organization, String label, LocalDate periodStart, LocalDate periodEnd) {
		this.id = UUID.randomUUID();
		this.organization = organization;
		this.label = label;
		this.periodStart = periodStart;
		this.periodEnd = periodEnd;
		this.consolidationApproach = organization.getConsolidationApproach();
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

	public Organization getOrganization() {
		return organization;
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

	public List<GhgRunLine> getLines() {
		return List.copyOf(lines);
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
