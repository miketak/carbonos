package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

/**
 * An organization's base year (spec 06, Chapter 5): the inventory that
 * established it, and the recalculation policy: the significance threshold
 * and the triggers the company honours.
 */
@Entity
@Table(name = "ghg_base_years")
public class BaseYear {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "organization_id", nullable = false)
	private Organization organization;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "inventory_id", nullable = false)
	private Inventory inventory;

	@Column(name = "threshold_percent", nullable = false, precision = 5, scale = 2)
	private BigDecimal thresholdPercent;

	@Column(name = "trigger_structural", nullable = false)
	private boolean triggerStructural;

	@Column(name = "trigger_methodology", nullable = false)
	private boolean triggerMethodology;

	@Column(name = "trigger_errors", nullable = false)
	private boolean triggerErrors;

	@OneToMany(mappedBy = "baseYear", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("createdAt ASC")
	private List<BaseYearRecalculation> recalculations = new ArrayList<>();

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected BaseYear() {
	}

	BaseYear(Organization organization, Inventory inventory, BigDecimal thresholdPercent, boolean triggerStructural,
			boolean triggerMethodology, boolean triggerErrors) {
		this.id = UUID.randomUUID();
		this.organization = organization;
		this.inventory = inventory;
		this.thresholdPercent = thresholdPercent;
		this.triggerStructural = triggerStructural;
		this.triggerMethodology = triggerMethodology;
		this.triggerErrors = triggerErrors;
	}

	public UUID getId() {
		return id;
	}

	public Organization getOrganization() {
		return organization;
	}

	public Inventory getInventory() {
		return inventory;
	}

	public BigDecimal getThresholdPercent() {
		return thresholdPercent;
	}

	public boolean isTriggerStructural() {
		return triggerStructural;
	}

	public boolean isTriggerMethodology() {
		return triggerMethodology;
	}

	public boolean isTriggerErrors() {
		return triggerErrors;
	}

	public List<BaseYearRecalculation> getRecalculations() {
		return List.copyOf(recalculations);
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	void update(Inventory inventory, BigDecimal thresholdPercent, boolean triggerStructural,
			boolean triggerMethodology, boolean triggerErrors) {
		this.inventory = inventory;
		this.thresholdPercent = thresholdPercent;
		this.triggerStructural = triggerStructural;
		this.triggerMethodology = triggerMethodology;
		this.triggerErrors = triggerErrors;
	}

	BaseYearRecalculation flag(RecalculationTrigger trigger, String reason, Inventory triggeringInventory,
			BoundaryVersion version, BigDecimal affectedPercent) {
		var above = affectedPercent != null && affectedPercent.compareTo(thresholdPercent) > 0;
		var recalculation = new BaseYearRecalculation(this, trigger, reason, triggeringInventory, version,
				affectedPercent, above);
		recalculations.add(recalculation);
		return recalculation;
	}

	boolean hasUnresolvedFlag() {
		return recalculations.stream().anyMatch(r -> r.getStatus() == RecalculationStatus.FLAGGED);
	}
}
