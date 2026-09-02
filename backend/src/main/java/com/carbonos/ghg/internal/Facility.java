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

	// the approach-independent control facts of the corporate structure (spec 007)
	@Column(name = "financial_control", nullable = false)
	private boolean financialControl;

	@Column(name = "operational_control", nullable = false)
	private boolean operationalControl;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected Facility() {
	}

	Facility(Organization organization, String name, String location, BigDecimal equitySharePercent,
			boolean financialControl, boolean operationalControl) {
		this.id = UUID.randomUUID();
		this.organization = organization;
		this.name = name;
		this.location = location;
		this.equitySharePercent = equitySharePercent;
		this.financialControl = financialControl;
		this.operationalControl = operationalControl;
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

	public boolean isFinancialControl() {
		return financialControl;
	}

	public boolean isOperationalControl() {
		return operationalControl;
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

	void setFinancialControl(boolean financialControl) {
		this.financialControl = financialControl;
	}

	void setOperationalControl(boolean operationalControl) {
		this.operationalControl = operationalControl;
	}

}
