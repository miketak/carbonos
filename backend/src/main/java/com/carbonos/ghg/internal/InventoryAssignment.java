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

	// a positive number, or zero with "this record emits nothing" stated, or null for
	// "not estimated": a deliberate answer either way, which the review never fills in (spec 04.8)
	@Column(name = "estimated_kg_co2e", precision = 18, scale = 3)
	private BigDecimal estimatedKgCo2e;

	// the gas a record excluded as a Montreal Protocol gas holds, reported outside the scopes (spec 04.8)
	@Column(length = 60)
	private String gas;

	// copied from another inventory's decision about the same record (spec 05.3)
	@Column(nullable = false)
	private boolean inherited;

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

	/** The same decision about the same record in another inventory (spec 05.3). */
	InventoryAssignment(Inventory inventory, InventoryAssignment source) {
		this(inventory, source.activity);
		this.included = source.included;
		this.exclusionReason = source.exclusionReason;
		this.exclusionDetail = source.exclusionDetail;
		this.exclusionJustification = source.exclusionJustification;
		this.estimatedKgCo2e = source.estimatedKgCo2e;
		this.gas = source.gas;
		this.scope = source.scope;
		this.category = source.category;
		this.leaseType = source.leaseType;
		this.emissionFactor = source.emissionFactor;
		this.scopeJustification = source.scopeJustification;
		this.proxy = source.proxy;
		this.proxyJustification = source.proxyJustification;
		this.density = source.density;
		this.inherited = true;
	}

	public boolean isInherited() {
		return inherited;
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

	public String getGas() {
		return gas;
	}

	/** What the exclusion says about the emissions it leaves out (spec 04.8); null where none is asked. */
	public ExclusionEstimateState getEstimateState() {
		return ExclusionEstimateState.of(exclusionReason, estimatedKgCo2e);
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

	/**
	 * Re-derives a leased assignment's scope and category under another
	 * approach (spec 05.4, Appendix F); the factor and the rest stay. Returns
	 * whether the scope moved.
	 */
	boolean rederive(Scope scope, ActivityCategory category) {
		var moved = this.scope != scope;
		this.scope = scope;
		this.category = category;
		return moved;
	}

	void exclude(ExclusionReason reason, String detail) {
		exclude(reason, detail, null, null, null);
	}

	void exclude(ExclusionReason reason, String detail, String justification, BigDecimal estimatedKgCo2e, String gas) {
		this.included = false;
		this.exclusionReason = reason;
		this.exclusionDetail = detail;
		this.exclusionJustification = justification;
		this.estimatedKgCo2e = estimatedKgCo2e;
		this.gas = gas;
	}

	void include() {
		this.included = true;
		this.exclusionReason = null;
		this.exclusionDetail = null;
		this.exclusionJustification = null;
		this.estimatedKgCo2e = null;
		this.gas = null;
	}
}
