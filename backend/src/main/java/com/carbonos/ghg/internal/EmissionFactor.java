package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A row of the seeded factor library; read-only at runtime. */
@Entity
@Table(name = "ghg_emission_factors")
public class EmissionFactor {

	@Id
	private UUID id;

	@Column(nullable = false, length = 120)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private Scope scope;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 40)
	private ActivityCategory category;

	@Column(nullable = false, length = 30)
	private String unit;

	@Column(name = "kg_co2e_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal kgCo2ePerUnit;

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

	public Scope getScope() {
		return scope;
	}

	public ActivityCategory getCategory() {
		return category;
	}

	public String getUnit() {
		return unit;
	}

	public BigDecimal getKgCo2ePerUnit() {
		return kgCo2ePerUnit;
	}

	public String getSource() {
		return source;
	}
}
