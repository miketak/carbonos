package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** An intensity denominator of an inventory (spec 07.4): "Gold produced, 120,000 oz". */
@Entity
@Table(name = "ghg_intensity_metrics")
public class IntensityMetric {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "inventory_id", nullable = false)
	private Inventory inventory;

	@Column(nullable = false, length = 120)
	private String name;

	@Column(nullable = false, precision = 18, scale = 3)
	private BigDecimal value;

	@Column(nullable = false, length = 30)
	private String unit;

	protected IntensityMetric() {
	}

	IntensityMetric(Inventory inventory, String name, BigDecimal value, String unit) {
		this.id = UUID.randomUUID();
		this.inventory = inventory;
		this.name = name;
		this.value = value;
		this.unit = unit;
	}

	public UUID getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public BigDecimal getValue() {
		return value;
	}

	public String getUnit() {
		return unit;
	}
}
