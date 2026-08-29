package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "ghg_facilities")
public class Facility {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "organization_id", nullable = false)
	private Organization organization;

	@Column(nullable = false, length = 120)
	private String name;

	@Column(nullable = false, length = 120)
	private String location;

	@Column(name = "equity_share_percent", nullable = false, precision = 5, scale = 2)
	private BigDecimal equitySharePercent;

	@Column(nullable = false)
	private boolean controlled;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected Facility() {
	}

	Facility(Organization organization, String name, String location, BigDecimal equitySharePercent,
			boolean controlled) {
		this.id = UUID.randomUUID();
		this.organization = organization;
		this.name = name;
		this.location = location;
		this.equitySharePercent = equitySharePercent;
		this.controlled = controlled;
	}

	public UUID getId() {
		return id;
	}

	public Organization getOrganization() {
		return organization;
	}

	public String getName() {
		return name;
	}

	public String getLocation() {
		return location;
	}

	public BigDecimal getEquitySharePercent() {
		return equitySharePercent;
	}

	public boolean isControlled() {
		return controlled;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	void setName(String name) {
		this.name = name;
	}

	void setLocation(String location) {
		this.location = location;
	}

	void setEquitySharePercent(BigDecimal equitySharePercent) {
		this.equitySharePercent = equitySharePercent;
	}

	void setControlled(boolean controlled) {
		this.controlled = controlled;
	}

	/**
	 * Fraction of this facility's emissions the organization accounts for
	 * under the given consolidation approach: the equity share for
	 * {@link ConsolidationApproach#EQUITY_SHARE}, all or nothing for the
	 * control approaches.
	 */
	BigDecimal consolidationWeight(ConsolidationApproach approach) {
		if (approach == ConsolidationApproach.EQUITY_SHARE) {
			return equitySharePercent.movePointLeft(2);
		}
		return controlled ? BigDecimal.ONE : BigDecimal.ZERO;
	}
}
