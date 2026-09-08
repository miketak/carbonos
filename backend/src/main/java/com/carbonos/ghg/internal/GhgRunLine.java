package com.carbonos.ghg.internal;

import java.math.BigDecimal;
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
			BigDecimal nf3, BigDecimal biogenicCo2) {
	}

	/** The market-based side of a scope 2 line, present only when the facility has an instrument. */
	record Market(BigDecimal kgCo2e, BigDecimal factorKgCo2ePerKwh, MarketInstrument instrument) {
	}

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "run_id", nullable = false)
	private GhgRun run;

	@Column(name = "activity_id", nullable = false)
	private UUID activityId;

	@Column(name = "facility_id")
	private UUID facilityId;

	@Column(name = "facility_name", nullable = false, length = 120)
	private String facilityName;

	@Column(name = "factor_name", nullable = false, length = 120)
	private String factorName;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private Scope scope;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 40)
	private ActivityCategory category;

	@Enumerated(EnumType.STRING)
	@Column(name = "lease_type", length = 30)
	private LeaseType leaseType;

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

	@Column(name = "market_based_kg_co2e", precision = 18, scale = 3)
	private BigDecimal marketBasedKgCo2e;

	@Column(name = "market_factor_kg_co2e_per_kwh", precision = 12, scale = 6)
	private BigDecimal marketFactorKgCo2ePerKwh;

	@Enumerated(EnumType.STRING)
	@Column(name = "market_instrument", length = 30)
	private MarketInstrument marketInstrument;

	protected GhgRunLine() {
	}

	GhgRunLine(GhgRun run, InventoryAssignment assignment, BigDecimal convertedQuantity, BigDecimal conversionFactor,
			BigDecimal kgCo2ePerUnit, BigDecimal weight, BigDecimal kgCo2e, Gases gases, Market market) {
		var activity = assignment.getActivity();
		var factor = assignment.getEmissionFactor();
		this.id = UUID.randomUUID();
		this.run = run;
		this.activityId = activity.getId();
		this.facilityId = activity.getFacility().getId();
		this.facilityName = activity.getFacility().getName();
		this.factorName = factor.getName();
		this.scope = assignment.getScope();
		this.category = assignment.getCategory();
		this.leaseType = assignment.getLeaseType();
		this.quantity = activity.getQuantity();
		this.unit = activity.getUnit();
		this.factorUnit = factor.getUnit();
		this.convertedQuantity = convertedQuantity;
		this.conversionFactor = conversionFactor;
		this.kgCo2ePerUnit = kgCo2ePerUnit;
		this.weight = weight;
		this.kgCo2e = kgCo2e;
		this.co2Kg = gases.co2();
		this.ch4Kg = gases.ch4();
		this.n2oKg = gases.n2o();
		this.hfcsKgCo2e = gases.hfcs();
		this.pfcsKgCo2e = gases.pfcs();
		this.sf6Kg = gases.sf6();
		this.nf3Kg = gases.nf3();
		this.biogenicCo2Kg = gases.biogenicCo2();
		if (market != null) {
			this.marketBasedKgCo2e = market.kgCo2e();
			this.marketFactorKgCo2ePerKwh = market.factorKgCo2ePerKwh();
			this.marketInstrument = market.instrument();
		}
	}

	public UUID getId() {
		return id;
	}

	public UUID getActivityId() {
		return activityId;
	}

	public UUID getFacilityId() {
		return facilityId;
	}

	public String getFacilityName() {
		return facilityName;
	}

	public String getFactorName() {
		return factorName;
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
	BigDecimal marketOrLocationKgCo2e() {
		return marketBasedKgCo2e != null ? marketBasedKgCo2e : kgCo2e;
	}
}
