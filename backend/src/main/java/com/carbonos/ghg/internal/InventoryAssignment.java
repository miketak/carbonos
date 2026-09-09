package com.carbonos.ghg.internal;

import java.math.BigDecimal;
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

	// a manual exclusion's justification in words and its estimated magnitude (spec 04.4)
	@Column(name = "exclusion_justification", length = 500)
	private String exclusionJustification;

	@Column(name = "estimated_kg_co2e", precision = 18, scale = 3)
	private BigDecimal estimatedKgCo2e;

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

	// why the scope departs from the stream's (or the factor's) default, and whether the factor is a
	// proxy for a source with no published factor (spec 04.3)
	@Column(name = "scope_justification", length = 500)
	private String scopeJustification;

	@Column(nullable = false)
	private boolean proxy;

	@Column(name = "proxy_justification", length = 500)
	private String proxyJustification;

	// the density that bridges a record in mass and a factor per litre, or the reverse (spec 02.2)
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "density_id")
	private Density density;

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

	public String getExclusionJustification() {
		return exclusionJustification;
	}

	public BigDecimal getEstimatedKgCo2e() {
		return estimatedKgCo2e;
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

	public String getScopeJustification() {
		return scopeJustification;
	}

	public boolean isProxy() {
		return proxy;
	}

	public String getProxyJustification() {
		return proxyJustification;
	}

	public Density getDensity() {
		return density;
	}

	void classify(EmissionFactor factor, Scope scope, ActivityCategory category, LeaseType leaseType,
			String scopeJustification, boolean proxy, String proxyJustification, Density density) {
		this.density = density;
		this.emissionFactor = factor;
		this.scope = scope;
		this.category = category;
		this.leaseType = leaseType;
		this.scopeJustification = scopeJustification;
		this.proxy = proxy;
		this.proxyJustification = proxyJustification;
	}

	void exclude(ExclusionReason reason, String detail) {
		exclude(reason, detail, null, null);
	}

	void exclude(ExclusionReason reason, String detail, String justification, BigDecimal estimatedKgCo2e) {
		this.included = false;
		this.exclusionReason = reason;
		this.exclusionDetail = detail;
		this.exclusionJustification = justification;
		this.estimatedKgCo2e = estimatedKgCo2e;
	}

	void include() {
		this.included = true;
		this.exclusionReason = null;
		this.exclusionDetail = null;
		this.exclusionJustification = null;
		this.estimatedKgCo2e = null;
	}
}
