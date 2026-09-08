package com.carbonos.ghg.internal;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * One inventory's accounting decision about one activity record: included or
 * excluded (with a documented reason), and, when included, its classification:
 * the emission factor plus the scope and category the accountant chose (spec
 * 04.1). The underlying activity record is never modified (invariant 2).
 */
@Entity
@Table(name = "ghg_assignments")
public class InventoryAssignment {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "inventory_id", nullable = false)
	private Inventory inventory;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "activity_id", nullable = false)
	private ActivityRecord activity;

	@Column(nullable = false)
	private boolean included;

	@Enumerated(EnumType.STRING)
	@Column(name = "exclusion_reason", length = 40)
	private ExclusionReason exclusionReason;

	// why, in words, for automatic exclusions, e.g. the membership window (spec 03.2)
	@Column(name = "exclusion_detail", length = 255)
	private String exclusionDetail;

	@Enumerated(EnumType.STRING)
	@Column(length = 10)
	private Scope scope;

	@Enumerated(EnumType.STRING)
	@Column(length = 40)
	private ActivityCategory category;

	@Enumerated(EnumType.STRING)
	@Column(name = "lease_type", length = 30)
	private LeaseType leaseType;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "emission_factor_id")
	private EmissionFactor emissionFactor;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected InventoryAssignment() {
	}

	InventoryAssignment(Inventory inventory, ActivityRecord activity) {
		this.id = UUID.randomUUID();
		this.inventory = inventory;
		this.activity = activity;
		this.included = true;
	}

	public UUID getId() {
		return id;
	}

	public Inventory getInventory() {
		return inventory;
	}

	public ActivityRecord getActivity() {
		return activity;
	}

	public boolean isIncluded() {
		return included;
	}

	public ExclusionReason getExclusionReason() {
		return exclusionReason;
	}

	public String getExclusionDetail() {
		return exclusionDetail;
	}

	public Scope getScope() {
		return scope;
	}

	public ActivityCategory getCategory() {
		return category;
	}

	public LeaseType getLeaseType() {
		return leaseType;
	}

	public EmissionFactor getEmissionFactor() {
		return emissionFactor;
	}

	public boolean isClassified() {
		return emissionFactor != null;
	}

	void classify(EmissionFactor factor, Scope scope, ActivityCategory category, LeaseType leaseType) {
		this.emissionFactor = factor;
		this.scope = scope;
		this.category = category;
		this.leaseType = leaseType;
	}

	void exclude(ExclusionReason reason, String detail) {
		this.included = false;
		this.exclusionReason = reason;
		this.exclusionDetail = detail;
	}

	void include() {
		this.included = true;
		this.exclusionReason = null;
		this.exclusionDetail = null;
	}
}
