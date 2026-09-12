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
 * One activity's contribution to a run, denormalized into plain values so the
 * line stays a faithful audit record even after its sources change. Carries
 * kg per gas alongside CO2e (spec 07.1) and, for scope 2 lines with a
 * contractual instrument, the market-based figure beside the location-based
 * one.
 */
@Entity
@Table(name = "ghg_run_lines")
public class GhgRunLine {

	/** Kilograms of each gas a line emits; HFCs and PFCs are kg CO2e of the blend. */
	record Gases(BigDecimal co2, BigDecimal ch4, BigDecimal n2o, BigDecimal hfcs, BigDecimal pfcs, BigDecimal sf6,
			BigDecimal nf3, BigDecimal biogenicCo2, BigDecimal hfcsKg, BigDecimal pfcsKg, String blendGwpSource,
			boolean ch4Fossil) {
	}

	/** The record's period and how much of it the run counted (spec 04.2). */
	record Period(LocalDate start, LocalDate end, long days, long coveredDays, BigDecimal share, String note) {
	}

	/**
	 * The market-based side of a scope 2 line (spec 07.3): the kWh an instrument
	 * covered at its factor, the balance at the residual mix or the grid
	 * average, and the note that prints the split.
	 */
	record Market(BigDecimal kgCo2e, BigDecimal factorKgCo2ePerKwh, MarketInstrument instrument, String note,
			BigDecimal coveredKwh, BigDecimal balanceKwh, BigDecimal balanceKgCo2ePerKwh, Scope2MarketBasis balanceBasis) {
	}

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "run_id", nullable = false)
	private GhgRun run;

	@Column(name = "activity_id", nullable = false)
	private UUID activityId;

	// the record's number when the run was launched (spec 04.6); null on lines of runs before V34
	@Column(name = "record_no")
	private Integer recordNo;

	@Column(name = "facility_id")
	private UUID facilityId;

	@Column(name = "facility_name", nullable = false, length = 120)
	private String facilityName;

	// the facility's legal entity and country as they stood at run time (spec 07.4)
	@Column(name = "entity_id")
	private UUID entityId;

	@Column(name = "entity_name", length = 120)
	private String entityName;

	@Column(length = 2)
	private String country;

	@Column(name = "factor_name", nullable = false, length = 120)
	private String factorName;

	// the record's own description, its evidence reference and the factor's id, so the calculation
	// file traces a line to the primary document without the live tables (spec 07.5)
	@Column(name = "activity_type", length = 120)
	private String activityType;

	@Column(name = "evidence_ref", length = 150)
	private String evidenceRef;

	@Column(name = "factor_id")
	private UUID factorId;

	// the record's stream, the scope justification and the proxy flag (spec 04.3)
	@Column(name = "stream_name", length = 120)
	private String streamName;

	@Column(name = "scope_justification", length = 500)
	private String scopeJustification;

	@Column(nullable = false)
	private boolean proxy;

	@Column(name = "proxy_justification", length = 500)
	private String proxyJustification;

	// the record's data quality, its tier, its uncertainty and the evidence files attached when
	// the run was launched (spec 04.4)
	@Enumerated(EnumType.STRING)
	@Column(name = "data_quality", length = 20)
	private DataQuality dataQuality;

	@Column(name = "data_quality_tier")
	private Integer dataQualityTier;

	@Column(name = "uncertainty_percent", precision = 6, scale = 2)
	private BigDecimal uncertaintyPercent;

	@Column(name = "evidence_files", length = 1000)
	private String evidenceFiles;

	// the density applied and the conversion in words (spec 02.2)
	@Column(name = "density_material", length = 120)
	private String densityMaterial;

	@Column(name = "density_kg_per_litre", precision = 10, scale = 5)
	private BigDecimal densityKgPerLitre;

	@Column(name = "conversion_note", length = 500)
	private String conversionNote;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private Scope scope;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 40)
	private ActivityCategory category;

	@Enumerated(EnumType.STRING)
	@Column(name = "lease_type", length = 30)
	private LeaseType leaseType;

	// spec 02.4: a line calculated with a non-Kyoto factor is reported outside every scope
	@Enumerated(EnumType.STRING)
	@Column(name = "reporting_basis", nullable = false, length = 30)
	private ReportingBasis reportingBasis = ReportingBasis.SCOPES;

	@Column(nullable = false, precision = 14, scale = 3)
	private BigDecimal quantity;

	@Column(nullable = false, length = 30)
	private String unit;

	@Column(name = "factor_unit", nullable = false, length = 30)
	private String factorUnit;

	@Column(name = "converted_quantity", nullable = false, precision = 20, scale = 6)
	private BigDecimal convertedQuantity;

	@Column(name = "conversion_factor", nullable = false, precision = 20, scale = 10)
	private BigDecimal conversionFactor;

	@Column(name = "kg_co2e_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal kgCo2ePerUnit;

	@Column(nullable = false, precision = 7, scale = 4)
	private BigDecimal weight;

	// the record's period and the pro-rating the run applied (spec 04.2)
	@Column(name = "period_start", nullable = false)
	private LocalDate periodStart;

	@Column(name = "period_end", nullable = false)
	private LocalDate periodEnd;

	@Column(name = "period_days", nullable = false)
	private long periodDays;

	@Column(name = "covered_days", nullable = false)
	private long coveredDays;

	@Column(name = "period_share", nullable = false, precision = 9, scale = 6)
	private BigDecimal periodShare;

	@Column(name = "period_note", length = 255)
	private String periodNote;

	@Column(name = "kg_co2e", nullable = false, precision = 18, scale = 3)
	private BigDecimal kgCo2e;

	@Column(name = "co2_kg", nullable = false, precision = 18, scale = 3)
	private BigDecimal co2Kg;

	@Column(name = "ch4_kg", nullable = false, precision = 18, scale = 3)
	private BigDecimal ch4Kg;

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

	@Column(name = "blend_gwp_source", length = 20)
	private String blendGwpSource;

	// whether the line's methane is fossil (AR6: 29.8) or biogenic (AR6: 27.9)
	@Column(name = "ch4_fossil", nullable = false)
	private boolean ch4Fossil;

	// why the market-based figure is not the facility's instrument: it failed the Quality Criteria
	@Column(name = "market_note", length = 255)
	private String marketNote;

	@Column(name = "market_based_kg_co2e", precision = 18, scale = 3)
	private BigDecimal marketBasedKgCo2e;

	@Column(name = "market_factor_kg_co2e_per_kwh", precision = 12, scale = 6)
	private BigDecimal marketFactorKgCo2ePerKwh;

	@Enumerated(EnumType.STRING)
	@Column(name = "market_instrument", length = 30)
	private MarketInstrument marketInstrument;

	@Column(name = "market_covered_kwh", precision = 18, scale = 3)
	private BigDecimal marketCoveredKwh;

	@Column(name = "market_balance_kwh", precision = 18, scale = 3)
	private BigDecimal marketBalanceKwh;

	@Column(name = "market_balance_kg_co2e_per_kwh", precision = 12, scale = 6)
	private BigDecimal marketBalanceKgCo2ePerKwh;

	@Enumerated(EnumType.STRING)
	@Column(name = "market_balance_basis", length = 20)
	private Scope2MarketBasis marketBalanceBasis;

	protected GhgRunLine() {
	}

	GhgRunLine(GhgRun run, InventoryAssignment assignment, BigDecimal convertedQuantity, BigDecimal conversionFactor,
			BigDecimal kgCo2ePerUnit, BigDecimal weight, Period period, BigDecimal kgCo2e, Gases gases, Market market,
			String evidenceFiles, String conversionNote) {
		var activity = assignment.getActivity();
		this.conversionNote = conversionNote;
		if (assignment.getDensity() != null) {
			this.densityMaterial = assignment.getDensity().getMaterial();
			this.densityKgPerLitre = assignment.getDensity().getKgPerLitre();
		}
		this.dataQuality = activity.getDataQuality();
		this.dataQualityTier = activity.getDataQualityTier();
		this.uncertaintyPercent = activity.getUncertaintyPercent();
		this.evidenceFiles = evidenceFiles;
		var factor = assignment.getEmissionFactor();
		this.id = UUID.randomUUID();
		this.run = run;
		this.activityId = activity.getId();
		this.recordNo = activity.getRecordNo();
		this.facilityId = activity.getFacility().getId();
		this.facilityName = activity.getFacility().getName();
		this.entityId = activity.getFacility().getEntity().getId();
		this.entityName = activity.getFacility().getEntity().getName();
		this.country = activity.getFacility().getCountry();
		this.factorName = factor.getName();
		this.activityType = activity.getActivityType();
		this.evidenceRef = activity.getEvidenceRef();
		this.factorId = factor.getId();
		this.streamName = activity.getStream() == null ? null : activity.getStream().getName();
		this.scopeJustification = assignment.getScopeJustification();
		this.proxy = assignment.isProxy();
		this.proxyJustification = assignment.getProxyJustification();
		this.scope = assignment.getScope();
		this.category = assignment.getCategory();
		this.leaseType = assignment.getLeaseType();
		this.reportingBasis = factor.getReportingBasis();
		this.quantity = activity.getQuantity();
		this.unit = activity.getUnit();
		this.factorUnit = factor.getUnit();
		this.convertedQuantity = convertedQuantity;
		this.conversionFactor = conversionFactor;
		this.kgCo2ePerUnit = kgCo2ePerUnit;
		this.weight = weight;
		this.periodStart = period.start();
		this.periodEnd = period.end();
		this.periodDays = period.days();
		this.coveredDays = period.coveredDays();
		this.periodShare = period.share();
		this.periodNote = period.note();
		this.kgCo2e = kgCo2e;
		this.co2Kg = gases.co2();
		this.ch4Kg = gases.ch4();
		this.n2oKg = gases.n2o();
		this.hfcsKgCo2e = gases.hfcs();
		this.pfcsKgCo2e = gases.pfcs();
		this.sf6Kg = gases.sf6();
		this.nf3Kg = gases.nf3();
		this.biogenicCo2Kg = gases.biogenicCo2();
		this.hfcsKg = gases.hfcsKg();
		this.pfcsKg = gases.pfcsKg();
		this.blendGwpSource = gases.blendGwpSource();
		this.ch4Fossil = gases.ch4Fossil();
		if (market != null) {
			this.marketBasedKgCo2e = market.kgCo2e();
			this.marketFactorKgCo2ePerKwh = market.factorKgCo2ePerKwh();
			this.marketInstrument = market.instrument();
			this.marketNote = market.note();
			this.marketCoveredKwh = market.coveredKwh();
			this.marketBalanceKwh = market.balanceKwh();
			this.marketBalanceKgCo2ePerKwh = market.balanceKgCo2ePerKwh();
			this.marketBalanceBasis = market.balanceBasis();
		}
	}

	public UUID getId() {
		return id;
	}

	public UUID getActivityId() {
		return activityId;
	}

	public Integer getRecordNo() {
		return recordNo;
	}

	/** {@code ACT-0001}, or empty on a line of a run before V34. */
	public String getRecordRef() {
		return ActivityRecord.ref(recordNo);
	}

	public UUID getFacilityId() {
		return facilityId;
	}

	public String getFacilityName() {
		return facilityName;
	}

	public UUID getEntityId() {
		return entityId;
	}

	public String getEntityName() {
		return entityName;
	}

	public String getCountry() {
		return country;
	}

	public String getFactorName() {
		return factorName;
	}

	public String getActivityType() {
		return activityType;
	}

	public String getEvidenceRef() {
		return evidenceRef;
	}

	public UUID getFactorId() {
		return factorId;
	}

	public String getStreamName() {
		return streamName;
	}

	public String getScopeJustification() {
		return scopeJustification;
	}

	public boolean isProxy() {
		return proxy;
	}

	public String getProxyJustification() {
		return proxyJustification;
	}

	public DataQuality getDataQuality() {
		return dataQuality;
	}

	public Integer getDataQualityTier() {
		return dataQualityTier;
	}

	public BigDecimal getUncertaintyPercent() {
		return uncertaintyPercent;
	}

	/** The evidence files attached to the record when the run was launched, comma separated; null for none. */
	public String getEvidenceFiles() {
		return evidenceFiles;
	}

	public String getDensityMaterial() {
		return densityMaterial;
	}

	public BigDecimal getDensityKgPerLitre() {
		return densityKgPerLitre;
	}

	/** "1 drum = 200 litre", or the mass-to-volume arithmetic through a density; null for a plain conversion. */
	public String getConversionNote() {
		return conversionNote;
	}

	public Scope getScope() {
		return scope;
	}

	public ActivityCategory getCategory() {
		return category;
	}

	public LeaseType getLeaseType() {
		return leaseType;
	}

	public ReportingBasis getReportingBasis() {
		return reportingBasis;
	}

	/**
	 * The quantity the arithmetic actually multiplied by the factor: the
	 * converted quantity after pro-rating and the accounting share. For a line
	 * whose factor is per kilogram of gas, this is the kilograms of gas the
	 * inventory counts (spec 02.4).
	 */
	public BigDecimal countedQuantity() {
		return convertedQuantity.multiply(periodShare).multiply(weight).setScale(3, java.math.RoundingMode.HALF_UP);
	}

	/**
	 * Whether this line counts in the scope totals (spec 02.4). A line
	 * calculated with a non-Kyoto factor is a snapshot like any other, but no
	 * scope total, by-scope table, by-gas row or intensity figure includes it.
	 */
	public boolean isInScopes() {
		return reportingBasis.inScopes();
	}

	public BigDecimal getQuantity() {
		return quantity;
	}

	public String getUnit() {
		return unit;
	}

	public String getFactorUnit() {
		return factorUnit;
	}

	public BigDecimal getConvertedQuantity() {
		return convertedQuantity;
	}

	public BigDecimal getConversionFactor() {
		return conversionFactor;
	}

	public BigDecimal getKgCo2ePerUnit() {
		return kgCo2ePerUnit;
	}

	public BigDecimal getWeight() {
		return weight;
	}

	public LocalDate getPeriodStart() {
		return periodStart;
	}

	public LocalDate getPeriodEnd() {
		return periodEnd;
	}

	public long getPeriodDays() {
		return periodDays;
	}

	public long getCoveredDays() {
		return coveredDays;
	}

	public BigDecimal getPeriodShare() {
		return periodShare;
	}

	public String getPeriodNote() {
		return periodNote;
	}

	public BigDecimal getKgCo2e() {
		return kgCo2e;
	}

	public BigDecimal getCo2Kg() {
		return co2Kg;
	}

	public BigDecimal getCh4Kg() {
		return ch4Kg;
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

	public BigDecimal getMarketBasedKgCo2e() {
		return marketBasedKgCo2e;
	}

	public BigDecimal getMarketFactorKgCo2ePerKwh() {
		return marketFactorKgCo2ePerKwh;
	}

	public MarketInstrument getMarketInstrument() {
		return marketInstrument;
	}

	/** The scope 2 figure under the market-based method: the instrument's, or the location-based one where none exists. */
	public BigDecimal getHfcsKg() {
		return hfcsKg;
	}

	public BigDecimal getPfcsKg() {
		return pfcsKg;
	}

	public String getBlendGwpSource() {
		return blendGwpSource;
	}

	public boolean isCh4Fossil() {
		return ch4Fossil;
	}

	/** The line's methane in CO2e under a set, on its own origin (fossil or biogenic). */
	public BigDecimal ch4KgCo2e(GwpSet gwp) {
		return ch4Kg.multiply(gwp.ch4(ch4Fossil));
	}

	/**
	 * Whether the line's factor published CO2e only (spec 07.7): it counts in
	 * the scope totals but no gas column carries it, so the by-gas table lists
	 * it on the reconciling row. Derived from the stored columns, never stored.
	 */
	public boolean isUnsplit() {
		return kgCo2e.signum() != 0 && co2Kg.signum() == 0 && ch4Kg.signum() == 0 && n2oKg.signum() == 0
				&& hfcsKgCo2e.signum() == 0 && pfcsKgCo2e.signum() == 0 && sf6Kg.signum() == 0 && nf3Kg.signum() == 0;
	}

	/** The line's kg CO2e when it is unsplit, else zero: the CSV column and the reconciling row sum this. */
	public BigDecimal co2eUnsplitKg() {
		return isUnsplit() ? kgCo2e : BigDecimal.ZERO;
	}

	public String getMarketNote() {
		return marketNote;
	}

	public BigDecimal getMarketCoveredKwh() {
		return marketCoveredKwh;
	}

	public BigDecimal getMarketBalanceKwh() {
		return marketBalanceKwh;
	}

	public BigDecimal getMarketBalanceKgCo2ePerKwh() {
		return marketBalanceKgCo2ePerKwh;
	}

	public Scope2MarketBasis getMarketBalanceBasis() {
		return marketBalanceBasis;
	}

	/** Whether a contractual instrument covered any of this line's kWh. */
	boolean instrumentApplied() {
		return marketCoveredKwh != null && marketCoveredKwh.signum() > 0;
	}

	BigDecimal marketOrLocationKgCo2e() {
		return marketBasedKgCo2e != null ? marketBasedKgCo2e : kgCo2e;
	}

	/** The scope 2 figure under the market-based method, for the report's breakdown tables (spec 07.4). */
	public BigDecimal marketBasedOrLocationKgCo2e() {
		return marketOrLocationKgCo2e();
	}
}
