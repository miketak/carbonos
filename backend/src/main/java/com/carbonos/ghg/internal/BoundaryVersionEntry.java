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

/**
 * One facility as a {@link BoundaryVersion} recorded it: the treatment plus
 * the accounting share derived from the version's approach, with the facility
 * name copied so the entry stays readable after the facility changes.
 */
@Entity
@Table(name = "ghg_boundary_version_entries")
public class BoundaryVersionEntry {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "boundary_version_id", nullable = false)
	private BoundaryVersion version;

	@Column(name = "facility_id", nullable = false)
	private UUID facilityId;

	@Column(name = "facility_name", nullable = false, length = 120)
	private String facilityName;

	@Column(nullable = false, length = 120)
	private String location;

	@Column(name = "ownership_percent", nullable = false, precision = 5, scale = 2)
	private BigDecimal ownershipPercent;

	@Column(name = "financial_control", nullable = false)
	private boolean financialControl;

	@Column(name = "operational_control", nullable = false)
	private boolean operationalControl;

	@Column(name = "accounting_share", nullable = false, precision = 7, scale = 4)
	private BigDecimal accountingShare;

	protected BoundaryVersionEntry() {
	}

	BoundaryVersionEntry(BoundaryVersion version, BoundaryTreatment treatment, ConsolidationApproach approach) {
		this.id = UUID.randomUUID();
		this.version = version;
		this.facilityId = treatment.getFacility().getId();
		this.facilityName = treatment.getFacility().getName();
		this.location = treatment.getFacility().getLocation();
		this.ownershipPercent = treatment.getOwnershipPercent();
		this.financialControl = treatment.isFinancialControl();
		this.operationalControl = treatment.isOperationalControl();
		this.accountingShare = treatment.accountingShare(approach);
	}

	public UUID getId() {
		return id;
	}

	public UUID getFacilityId() {
		return facilityId;
	}

	public String getFacilityName() {
		return facilityName;
	}

	public String getLocation() {
		return location;
	}

	public BigDecimal getOwnershipPercent() {
		return ownershipPercent;
	}

	public boolean isFinancialControl() {
		return financialControl;
	}

	public boolean isOperationalControl() {
		return operationalControl;
	}

	public BigDecimal getAccountingShare() {
		return accountingShare;
	}
}
