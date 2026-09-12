package com.carbonos.ghg.internal;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

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
 * One inventory's rule for deriving category 3 lines (spec 04.7): every
 * included scope 1 or scope 2 line calculated with the primary factor gains a
 * scope 3 line calculated with the upstream factor, on the same quantity and
 * the same shares. The rule belongs to the view, so it is edited while the
 * inventory is a draft, frozen with it, and copied with it.
 */
@Entity
@Table(name = "ghg_upstream_rules")
public class UpstreamRule {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "inventory_id", nullable = false)
	private Inventory inventory;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "primary_factor_id", nullable = false)
	private EmissionFactor primaryFactor;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "upstream_factor_id", nullable = false)
	private EmissionFactor upstreamFactor;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 40)
	private UpstreamRuleKind kind;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "created_by", length = 255)
	private String createdBy;

	protected UpstreamRule() {
	}

	UpstreamRule(Inventory inventory, EmissionFactor primaryFactor, EmissionFactor upstreamFactor,
			UpstreamRuleKind kind, String createdBy) {
		this.id = UUID.randomUUID();
		this.inventory = inventory;
		this.primaryFactor = primaryFactor;
		this.upstreamFactor = upstreamFactor;
		this.kind = kind;
		this.createdBy = createdBy;
	}

	public UUID getId() {
		return id;
	}

	public Inventory getInventory() {
		return inventory;
	}

	public EmissionFactor getPrimaryFactor() {
		return primaryFactor;
	}

	public EmissionFactor getUpstreamFactor() {
		return upstreamFactor;
	}

	public UpstreamRuleKind getKind() {
		return kind;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public String getCreatedBy() {
		return createdBy;
	}

	/** "Diesel (100% mineral diesel) &rarr; Well-to-tank diesel", as the gate and the methodology list it. */
	public String describe() {
		return primaryFactor.getName() + " → " + upstreamFactor.getName();
	}
}
