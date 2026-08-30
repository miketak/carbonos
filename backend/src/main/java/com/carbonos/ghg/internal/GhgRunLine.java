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
 * line stays a faithful audit record even after its sources change.
 */
@Entity
@Table(name = "ghg_run_lines")
public class GhgRunLine {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "run_id", nullable = false)
	private GhgRun run;

	@Column(name = "activity_id", nullable = false)
	private UUID activityId;

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

	protected GhgRunLine() {
	}

	GhgRunLine(GhgRun run, InventoryAssignment assignment, BigDecimal convertedQuantity, BigDecimal conversionFactor,
			BigDecimal weight, BigDecimal kgCo2e) {
		var activity = assignment.getActivity();
		var factor = assignment.getEmissionFactor();
		this.id = UUID.randomUUID();
		this.run = run;
		this.activityId = activity.getId();
		this.facilityName = activity.getFacility().getName();
		this.factorName = factor.getName();
		this.scope = assignment.getScope();
		this.category = assignment.getCategory();
		this.quantity = activity.getQuantity();
		this.unit = activity.getUnit();
		this.factorUnit = factor.getUnit();
		this.convertedQuantity = convertedQuantity;
		this.conversionFactor = conversionFactor;
		this.kgCo2ePerUnit = factor.getKgCo2ePerUnit();
		this.weight = weight;
		this.kgCo2e = kgCo2e;
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

	public String getFactorName() {
		return factorName;
	}

	public Scope getScope() {
		return scope;
	}

	public ActivityCategory getCategory() {
		return category;
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
}
