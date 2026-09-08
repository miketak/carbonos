package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A row of the seeded factor library; read-only at runtime. A factor suggests
 * a default scope and category (spec 04.1) and carries per-gas components
 * (spec 07.1): kg of CO2, CH4, N2O, SF6 and NF3 per unit, kg CO2e of HFC and
 * PFC blends per unit, and biogenic CO2 reported outside the scopes.
 */
@Entity
@Table(name = "ghg_emission_factors")
public class EmissionFactor {

	@Id
	private UUID id;

	@Column(nullable = false, length = 120)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(name = "default_scope", nullable = false, length = 10)
	private Scope defaultScope;

	@Enumerated(EnumType.STRING)
	@Column(name = "default_category", nullable = false, length = 40)
	private ActivityCategory defaultCategory;

	// the same physics whoever owns the source: usable in scope 1 or scope 3
	@Column(name = "scope_agnostic", nullable = false)
	private boolean scopeAgnostic;

	@Column(nullable = false, length = 30)
	private String unit;

	// the source's CO2e, on its own GWP basis; the fallback when no gas split is recorded
	@Column(name = "kg_co2e_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal kgCo2ePerUnit;

	@Column(name = "co2_kg_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal co2KgPerUnit;

	@Column(name = "ch4_kg_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal ch4KgPerUnit;

	@Column(name = "n2o_kg_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal n2oKgPerUnit;

	@Column(name = "hfcs_kg_co2e_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal hfcsKgCo2ePerUnit;

	@Column(name = "pfcs_kg_co2e_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal pfcsKgCo2ePerUnit;

	@Column(name = "sf6_kg_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal sf6KgPerUnit;

	@Column(name = "nf3_kg_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal nf3KgPerUnit;

	@Column(name = "biogenic_co2_kg_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal biogenicCo2KgPerUnit;

	@Column(nullable = false, length = 120)
	private String source;

	protected EmissionFactor() {
	}

	public UUID getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public Scope getDefaultScope() {
		return defaultScope;
	}

	public ActivityCategory getDefaultCategory() {
		return defaultCategory;
	}

	public boolean isScopeAgnostic() {
		return scopeAgnostic;
	}

	public String getUnit() {
		return unit;
	}

	public BigDecimal getKgCo2ePerUnit() {
		return kgCo2ePerUnit;
	}

	public BigDecimal getCo2KgPerUnit() {
		return co2KgPerUnit;
	}

	public BigDecimal getCh4KgPerUnit() {
		return ch4KgPerUnit;
	}

	public BigDecimal getN2oKgPerUnit() {
		return n2oKgPerUnit;
	}

	public BigDecimal getHfcsKgCo2ePerUnit() {
		return hfcsKgCo2ePerUnit;
	}

	public BigDecimal getPfcsKgCo2ePerUnit() {
		return pfcsKgCo2ePerUnit;
	}

	public BigDecimal getSf6KgPerUnit() {
		return sf6KgPerUnit;
	}

	public BigDecimal getNf3KgPerUnit() {
		return nf3KgPerUnit;
	}

	public BigDecimal getBiogenicCo2KgPerUnit() {
		return biogenicCo2KgPerUnit;
	}

	public String getSource() {
		return source;
	}

	/** Whether the factor records a per-gas split at all. */
	public boolean hasGasSplit() {
		return co2KgPerUnit.signum() != 0 || ch4KgPerUnit.signum() != 0 || n2oKgPerUnit.signum() != 0
				|| hfcsKgCo2ePerUnit.signum() != 0 || pfcsKgCo2ePerUnit.signum() != 0 || sf6KgPerUnit.signum() != 0
				|| nf3KgPerUnit.signum() != 0;
	}

	/**
	 * kg CO2e per unit under a reporting GWP set: the gas split weighted by the
	 * set's potentials, or the source's own CO2e when no split is recorded.
	 */
	public BigDecimal kgCo2ePerUnit(GwpSet gwp) {
		if (!hasGasSplit()) {
			return kgCo2ePerUnit;
		}
		return co2KgPerUnit.add(ch4KgPerUnit.multiply(gwp.ch4()))
			.add(n2oKgPerUnit.multiply(gwp.n2o()))
			.add(sf6KgPerUnit.multiply(gwp.sf6()))
			.add(nf3KgPerUnit.multiply(gwp.nf3()))
			.add(hfcsKgCo2ePerUnit)
			.add(pfcsKgCo2ePerUnit);
	}

	/** Whether this factor may be used in a scope, given its default and whether the physics is scope-agnostic. */
	public boolean compatibleWith(Scope scope) {
		return scopeAgnostic || defaultScope == scope;
	}
}
