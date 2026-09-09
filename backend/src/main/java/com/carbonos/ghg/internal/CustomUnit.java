package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A unit an organization defines as a multiple of a registered unit (spec
 * 02.2): "1 drum = 200 litre". It converts like any registered unit of the
 * base unit's dimension, and lines print the definition they applied.
 */
@Entity
@Table(name = "ghg_custom_units")
public class CustomUnit {

	@Id
	private UUID id;

	@Column(name = "organization_id", nullable = false)
	private UUID organizationId;

	@Column(nullable = false, length = 30)
	private String code;

	@Column(nullable = false, length = 120)
	private String label;

	@Column(name = "base_unit", nullable = false, length = 30)
	private String baseUnit;

	@Column(nullable = false, precision = 18, scale = 6)
	private BigDecimal factor;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected CustomUnit() {
	}

	CustomUnit(UUID organizationId, String code, String label, String baseUnit, BigDecimal factor) {
		this.id = UUID.randomUUID();
		this.organizationId = organizationId;
		this.code = code;
		this.label = label;
		this.baseUnit = baseUnit;
		this.factor = factor;
	}

	public UUID getId() {
		return id;
	}

	public UUID getOrganizationId() {
		return organizationId;
	}

	public String getCode() {
		return code;
	}

	public String getLabel() {
		return label;
	}

	public String getBaseUnit() {
		return baseUnit;
	}

	public BigDecimal getFactor() {
		return factor;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	/** "1 drum = 200 litre". */
	public String definition() {
		return "1 " + code + " = " + factor.stripTrailingZeros().toPlainString() + " " + baseUnit;
	}

	void update(String code, String label, String baseUnit, BigDecimal factor) {
		this.code = code;
		this.label = label;
		this.baseUnit = baseUnit;
		this.factor = factor;
	}
}
