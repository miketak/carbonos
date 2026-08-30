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

/**
 * A facility's membership in one inventory's organizational boundary, with
 * the ownership/control facts that determine its accounting share. The same
 * facility can be treated differently by different inventories.
 */
@Entity
@Table(name = "ghg_boundary_treatments")
public class BoundaryTreatment {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "inventory_id", nullable = false)
	private Inventory inventory;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "facility_id", nullable = false)
	private Facility facility;

	@Column(name = "ownership_percent", nullable = false, precision = 5, scale = 2)
	private BigDecimal ownershipPercent;

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

	protected BoundaryTreatment() {
	}

	BoundaryTreatment(Inventory inventory, Facility facility, BigDecimal ownershipPercent, boolean financialControl,
			boolean operationalControl) {
		this.id = UUID.randomUUID();
		this.inventory = inventory;
		this.facility = facility;
		this.ownershipPercent = ownershipPercent;
		this.financialControl = financialControl;
		this.operationalControl = operationalControl;
	}

	public UUID getId() {
		return id;
	}

	public Inventory getInventory() {
		return inventory;
	}

	public Facility getFacility() {
		return facility;
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

	void update(BigDecimal ownershipPercent, boolean financialControl, boolean operationalControl) {
		this.ownershipPercent = ownershipPercent;
		this.financialControl = financialControl;
		this.operationalControl = operationalControl;
	}

	/** Fraction of the facility's emissions this inventory accounts for. */
	public BigDecimal accountingShare(ConsolidationApproach approach) {
		return switch (approach) {
			case EQUITY_SHARE -> ownershipPercent.movePointLeft(2);
			case FINANCIAL_CONTROL -> financialControl ? BigDecimal.ONE : BigDecimal.ZERO;
			case OPERATIONAL_CONTROL -> operationalControl ? BigDecimal.ONE : BigDecimal.ZERO;
		};
	}
}
