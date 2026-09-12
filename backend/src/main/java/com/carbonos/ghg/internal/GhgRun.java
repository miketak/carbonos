package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.Hibernate;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Formula;

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
 * the moment it was calculated (spec 05, invariant 3). Lines denormalize
 * every input, exclusions record what was left out and why (spec 05.1), so
 * later edits to facts, boundary, or classification never rewrite a past run.
 * Recalculation creates a new run.
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

	// one more than the highest number the inventory ever issued; never reused (spec 05.2)
	@Column(name = "run_no", nullable = false)
	private int runNo;

	// a voided run stays on the record with its number, its figures and the reason
	@Column(name = "voided_at")
	private Instant voidedAt;

	@Column(name = "voided_by_user_id")
	private UUID voidedByUserId;

	@Column(name = "voided_by", length = 320)
	private String voidedBy;

	@Column(name = "void_reason", length = 500)
	private String voidReason;

	// who launched the run: the report's "prepared by" (spec 07.4)
	@Column(name = "created_by", length = 320)
	private String createdBy;

	@OneToMany(mappedBy = "run", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("name ASC")
	private List<GhgRunFactor> factors = new ArrayList<>();

	@Column(name = "period_start", nullable = false)
	private LocalDate periodStart;

	@Column(name = "period_end", nullable = false)
	private LocalDate periodEnd;

	@Enumerated(EnumType.STRING)
	@Column(name = "consolidation_approach", nullable = false, length = 30)
	private ConsolidationApproach consolidationApproach;

	@Enumerated(EnumType.STRING)
	@Column(name = "gwp_set", nullable = false, length = 5)
	private GwpSet gwpSet;

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

	// scope 2 under the market-based method, reported on every run (spec 07.3)
	@Column(name = "scope2_market_based_kg_co2e", nullable = false, precision = 18, scale = 3)
	private BigDecimal scope2MarketBasedKgCo2e;

	// what the market-based figure rests on: instruments, the residual mix, or the grid average
	@Enumerated(EnumType.STRING)
	@Column(name = "scope2_market_basis", nullable = false, length = 20)
	private Scope2MarketBasis scope2MarketBasis;

	@Column(name = "co2_kg", nullable = false, precision = 18, scale = 3)
	private BigDecimal co2Kg;

	@Column(name = "ch4_kg", nullable = false, precision = 18, scale = 3)
	private BigDecimal ch4Kg;

	// the fossil-origin part of ch4Kg, so the by-gas table can apply AR6's two methane potentials
	@Column(name = "ch4_fossil_kg", nullable = false, precision = 18, scale = 3)
	private BigDecimal ch4FossilKg;

	@Column(name = "n2o_kg", nullable = false, precision = 18, scale = 3)
	private BigDecimal n2oKg;

	@Column(name = "hfcs_kg_co2e", nullable = false, precision = 18, scale = 3)
	private BigDecimal hfcsKgCo2e;

	@Column(name = "pfcs_kg_co2e", nullable = false, precision = 18, scale = 3)
	private BigDecimal pfcsKgCo2e;

	@Column(name = "sf6_kg", nullable = false, precision = 18, scale = 3)
	private BigDecimal sf6Kg;

	@Column(name = "nf3_kg", nullable = false, precision = 18, scale = 3)
	private BigDecimal nf3Kg;

	@Column(name = "biogenic_co2_kg", nullable = false, precision = 18, scale = 3)
	private BigDecimal biogenicCo2Kg;

	@Column(name = "hfcs_kg", nullable = false, precision = 18, scale = 3)
	private BigDecimal hfcsKg;

	@Column(name = "pfcs_kg", nullable = false, precision = 18, scale = 3)
	private BigDecimal pfcsKg;

	// the boundary version the shares came from; null for runs older than spec 03
	@Column(name = "boundary_version_id")
	private UUID boundaryVersionId;

	@Column(name = "boundary_version_no")
	private Integer boundaryVersionNo;

	@OneToMany(mappedBy = "run", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("kgCo2e DESC")
	private List<GhgRunLine> lines = new ArrayList<>();

	// spec 07.7: the CO2e of the lines whose factor published no gas split, derived from the lines' stored
	// columns (see GhgRunLine.isUnsplit) so a listing does not load every line; nothing is stored for it
	@Formula("(select coalesce(sum(l.kg_co2e), 0) from ghg_run_lines l where l.run_id = id and l.kg_co2e <> 0"
			+ " and l.co2_kg = 0 and l.ch4_kg = 0 and l.n2o_kg = 0 and l.hfcs_kg_co2e = 0 and l.pfcs_kg_co2e = 0"
			+ " and l.sf6_kg = 0 and l.nf3_kg = 0)")
	private BigDecimal co2eUnsplitKgLoaded;

	@OneToMany(mappedBy = "run", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("exclusionReason ASC, periodEnd ASC")
	private List<GhgRunExclusion> exclusions = new ArrayList<>();

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected GhgRun() {
	}

	GhgRun(Inventory inventory, int runNo, String label, String createdBy) {
		this.id = UUID.randomUUID();
		this.inventory = inventory;
		this.runNo = runNo;
		this.label = label;
		this.createdBy = createdBy;
		this.periodStart = inventory.getPeriodStart();
		this.periodEnd = inventory.getPeriodEnd();
		this.consolidationApproach = inventory.getConsolidationApproach();
		this.gwpSet = inventory.getGwpSet();
		this.boundaryVersionId = inventory.getCurrentBoundaryVersionId();
		this.boundaryVersionNo = inventory.getCurrentBoundaryVersionNo();
		this.activityCount = 0;
		this.totalKgCo2e = BigDecimal.ZERO;
		this.scope1KgCo2e = BigDecimal.ZERO;
		this.scope2KgCo2e = BigDecimal.ZERO;
		this.scope3KgCo2e = BigDecimal.ZERO;
		this.scope2MarketBasedKgCo2e = BigDecimal.ZERO;
		this.scope2MarketBasis = Scope2MarketBasis.GRID_AVERAGE;
		this.co2Kg = BigDecimal.ZERO;
		this.ch4Kg = BigDecimal.ZERO;
		this.ch4FossilKg = BigDecimal.ZERO;
		this.n2oKg = BigDecimal.ZERO;
		this.hfcsKgCo2e = BigDecimal.ZERO;
		this.pfcsKgCo2e = BigDecimal.ZERO;
		this.sf6Kg = BigDecimal.ZERO;
		this.nf3Kg = BigDecimal.ZERO;
		this.biogenicCo2Kg = BigDecimal.ZERO;
		this.hfcsKg = BigDecimal.ZERO;
		this.pfcsKg = BigDecimal.ZERO;
	}

	void addLine(GhgRunLine line) {
		lines.add(line);
		activityCount++;
		totalKgCo2e = totalKgCo2e.add(line.getKgCo2e());
		switch (line.getScope()) {
			case SCOPE_1 -> scope1KgCo2e = scope1KgCo2e.add(line.getKgCo2e());
			case SCOPE_2 -> {
				scope2KgCo2e = scope2KgCo2e.add(line.getKgCo2e());
				scope2MarketBasedKgCo2e = scope2MarketBasedKgCo2e.add(line.marketOrLocationKgCo2e());
				if (line.instrumentApplied()) {
					scope2MarketBasis = Scope2MarketBasis.INSTRUMENTS;
				}
				else if (line.getMarketBalanceBasis() == Scope2MarketBasis.RESIDUAL_MIX
						&& scope2MarketBasis != Scope2MarketBasis.INSTRUMENTS) {
					scope2MarketBasis = Scope2MarketBasis.RESIDUAL_MIX;
				}
			}
			case SCOPE_3 -> scope3KgCo2e = scope3KgCo2e.add(line.getKgCo2e());
		}
		co2Kg = co2Kg.add(line.getCo2Kg());
		ch4Kg = ch4Kg.add(line.getCh4Kg());
		if (line.isCh4Fossil()) {
			ch4FossilKg = ch4FossilKg.add(line.getCh4Kg());
		}
		n2oKg = n2oKg.add(line.getN2oKg());
		hfcsKgCo2e = hfcsKgCo2e.add(line.getHfcsKgCo2e());
		pfcsKgCo2e = pfcsKgCo2e.add(line.getPfcsKgCo2e());
		sf6Kg = sf6Kg.add(line.getSf6Kg());
		nf3Kg = nf3Kg.add(line.getNf3Kg());
		biogenicCo2Kg = biogenicCo2Kg.add(line.getBiogenicCo2Kg());
		hfcsKg = hfcsKg.add(line.getHfcsKg());
		pfcsKg = pfcsKg.add(line.getPfcsKg());
	}

	public BigDecimal getHfcsKg() {
		return hfcsKg;
	}

	public BigDecimal getPfcsKg() {
		return pfcsKg;
	}

	/**
	 * CO2e of the lines whose factor published CO2e only (spec 07.7): the by-gas
	 * table's reconciling row. Summed from the lines when they are loaded (a
	 * detail, a report, a run just launched), else read by the formula.
	 */
	public BigDecimal co2eUnsplitKg() {
		if (Hibernate.isInitialized(lines)) {
			return lines.stream().map(GhgRunLine::co2eUnsplitKg).reduce(BigDecimal.ZERO, BigDecimal::add);
		}
		return co2eUnsplitKgLoaded == null ? BigDecimal.ZERO : co2eUnsplitKgLoaded;
	}

	/** The factors behind the reconciling row, largest contribution first (spec 07.7). */
	public List<String> unsplitFactorNames() {
		var byFactor = new java.util.LinkedHashMap<String, BigDecimal>();
		for (var line : lines) {
			if (line.isUnsplit()) {
				byFactor.merge(line.getFactorName(), line.getKgCo2e(), BigDecimal::add);
			}
		}
		return byFactor.entrySet()
			.stream()
			.sorted(java.util.Map.Entry.<String, BigDecimal>comparingByValue().reversed()
				.thenComparing(java.util.Map.Entry.comparingByKey()))
			.map(java.util.Map.Entry::getKey)
			.toList();
	}

	/** Every assessment report behind this run's CO2e: the run's set, plus any blend source that differs. */
	public List<String> assessmentReports() {
		var reports = new ArrayList<String>();
		reports.add(gwpSet.name());
		lines.stream()
			.map(GhgRunLine::getBlendGwpSource)
			.filter(source -> source != null && !reports.contains(source))
			.forEach(reports::add);
		return reports;
	}

	void addExclusion(GhgRunExclusion exclusion) {
		exclusions.add(exclusion);
	}

	void addFactor(GhgRunFactor factor) {
		factors.add(factor);
	}

	public List<GhgRunFactor> getFactors() {
		return List.copyOf(factors);
	}

	public String getCreatedBy() {
		return createdBy;
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

	public int getRunNo() {
		return runNo;
	}

	public boolean isVoided() {
		return voidedAt != null;
	}

	public Instant getVoidedAt() {
		return voidedAt;
	}

	public UUID getVoidedByUserId() {
		return voidedByUserId;
	}

	public String getVoidedBy() {
		return voidedBy;
	}

	public String getVoidReason() {
		return voidReason;
	}

	/** Marks the run void (spec 05.2). The lines and totals stay as they were calculated. */
	void markVoid(UUID actorUserId, String actor, String reason) {
		this.voidedAt = Instant.now();
		this.voidedByUserId = actorUserId;
		this.voidedBy = actor;
		this.voidReason = reason;
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

	public GwpSet getGwpSet() {
		return gwpSet;
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

	public BigDecimal getScope2MarketBasedKgCo2e() {
		return scope2MarketBasedKgCo2e;
	}

	public Scope2MarketBasis getScope2MarketBasis() {
		return scope2MarketBasis;
	}

	public BigDecimal getCo2Kg() {
		return co2Kg;
	}

	public BigDecimal getCh4Kg() {
		return ch4Kg;
	}

	public BigDecimal getCh4FossilKg() {
		return ch4FossilKg;
	}

	/** CH4 in CO2e under the run's set: fossil and biogenic methane at their own potentials. */
	public BigDecimal ch4KgCo2e() {
		return ch4FossilKg.multiply(gwpSet.ch4(true)).add(ch4Kg.subtract(ch4FossilKg).multiply(gwpSet.ch4(false)));
	}

	public BigDecimal getN2oKg() {
		return n2oKg;
	}

	public BigDecimal getHfcsKgCo2e() {
		return hfcsKgCo2e;
	}

	public BigDecimal getPfcsKgCo2e() {
		return pfcsKgCo2e;
	}

	public BigDecimal getSf6Kg() {
		return sf6Kg;
	}

	public BigDecimal getNf3Kg() {
		return nf3Kg;
	}

	public BigDecimal getBiogenicCo2Kg() {
		return biogenicCo2Kg;
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

	public List<GhgRunExclusion> getExclusions() {
		return List.copyOf(exclusions);
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
