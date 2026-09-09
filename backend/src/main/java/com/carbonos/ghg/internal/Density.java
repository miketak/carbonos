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
 * The density of a fuel or material in kg per litre (spec 02.2), so a record
 * in mass can drive a factor per litre and the other way round. Shared rows
 * (no organization) are typical planning values the gate warns about; an
 * organization's own rows come from supplier specifications.
 */
@Entity
@Table(name = "ghg_densities")
public class Density {

	@Id
	private UUID id;

	@Column(name = "organization_id")
	private UUID organizationId;

	@Column(nullable = false, length = 120)
	private String material;

	@Column(name = "kg_per_litre", nullable = false, precision = 10, scale = 5)
	private BigDecimal kgPerLitre;

	@Column(nullable = false, length = 500)
	private String source;

	@Column(length = 500)
	private String note;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected Density() {
	}

	Density(UUID organizationId, String material, BigDecimal kgPerLitre, String source, String note) {
		this.id = UUID.randomUUID();
		this.organizationId = organizationId;
		this.material = material;
		this.kgPerLitre = kgPerLitre;
		this.source = source;
		this.note = note;
	}

	public UUID getId() {
		return id;
	}

	public UUID getOrganizationId() {
		return organizationId;
	}

	/** A shared typical value rather than a supplier's figure. */
	public boolean isTypical() {
		return organizationId == null;
	}

	public String getMaterial() {
		return material;
	}

	public BigDecimal getKgPerLitre() {
		return kgPerLitre;
	}

	public String getSource() {
		return source;
	}

	public String getNote() {
		return note;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	void update(String material, BigDecimal kgPerLitre, String source, String note) {
		this.material = material;
		this.kgPerLitre = kgPerLitre;
		this.source = source;
		this.note = note;
	}
}
