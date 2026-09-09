package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
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
 * A legal entity the organization consolidates (spec 03.1, 03.3): its Table 1
 * relationship type, the economic interest (which equity share reflects), for
 * disclosure the legal ownership percent, the control facts, and the parent
 * through which the company holds it. Facilities belong to entities; the
 * accounting share flows down from the entity, and through the chain of
 * parents as Chapter 3 requires ("applied to all levels of the organization").
 */
@Entity
@Table(name = "ghg_entities")
public class LegalEntity {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "organization_id", nullable = false)
	private Organization organization;

	// the entity through which the company holds this one; null when held directly
	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "parent_entity_id")
	private LegalEntity parent;

	@Column(nullable = false, length = 120)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(name = "relationship_type", nullable = false, length = 30)
	private RelationshipType relationshipType;

	@Column(name = "economic_interest_percent", nullable = false, precision = 5, scale = 2)
	private BigDecimal economicInterestPercent;

	@Column(name = "legal_ownership_percent", precision = 5, scale = 2)
	private BigDecimal legalOwnershipPercent;

	@Column(name = "operated_by_company", nullable = false)
	private boolean operatedByCompany;

	// financial control, recorded for franchises only (spec 03.3); every other row implies it
	@Column(name = "controlled_by_company", nullable = false)
	private boolean controlledByCompany;

	// the organization itself, the subsidiary facilities default to
	@Column(name = "reporting_company", nullable = false)
	private boolean reportingCompany;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected LegalEntity() {
	}

	LegalEntity(Organization organization, String name, RelationshipType relationshipType,
			BigDecimal economicInterestPercent, BigDecimal legalOwnershipPercent, boolean operatedByCompany,
			boolean controlledByCompany, LegalEntity parent, boolean reportingCompany) {
		this.id = UUID.randomUUID();
		this.organization = organization;
		this.name = name;
		this.relationshipType = relationshipType;
		this.economicInterestPercent = economicInterestPercent;
		this.legalOwnershipPercent = legalOwnershipPercent;
		this.operatedByCompany = operatedByCompany;
		this.controlledByCompany = controlledByCompany;
		this.parent = parent;
		this.reportingCompany = reportingCompany;
	}

	public UUID getId() {
		return id;
	}

	public Organization getOrganization() {
		return organization;
	}

	public LegalEntity getParent() {
		return parent;
	}

	public String getName() {
		return name;
	}

	public RelationshipType getRelationshipType() {
		return relationshipType;
	}

	public BigDecimal getEconomicInterestPercent() {
		return economicInterestPercent;
	}

	public BigDecimal getLegalOwnershipPercent() {
		return legalOwnershipPercent;
	}

	public boolean isOperatedByCompany() {
		return operatedByCompany;
	}

	public boolean isControlledByCompany() {
		return controlledByCompany;
	}

	public boolean isReportingCompany() {
		return reportingCompany;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	void update(String name, RelationshipType relationshipType, BigDecimal economicInterestPercent,
			BigDecimal legalOwnershipPercent, boolean operatedByCompany, boolean controlledByCompany,
			LegalEntity parent) {
		this.name = name;
		this.relationshipType = relationshipType;
		this.economicInterestPercent = economicInterestPercent;
		this.legalOwnershipPercent = legalOwnershipPercent;
		this.operatedByCompany = operatedByCompany;
		this.controlledByCompany = controlledByCompany;
		this.parent = parent;
	}

	void setName(String name) {
		this.name = name;
	}

	/** The share Table 1 gives this entity's own row under an approach, before the chain. */
	public BigDecimal ownShare(ConsolidationApproach approach) {
		return Table1.share(relationshipType, approach, economicInterestPercent, operatedByCompany,
				controlledByCompany);
	}

	/**
	 * The share the company accounts for under an approach: this entity's Table
	 * 1 row applied at its own level, times the share of every parent up to the
	 * reporting company (the Standard's Holland Industries example: 50% of a
	 * venture held by an 83% subsidiary is 41.5% under equity share and 50%
	 * under financial control).
	 */
	public BigDecimal share(ConsolidationApproach approach) {
		var share = ownShare(approach);
		for (var ancestor = parent; ancestor != null; ancestor = ancestor.parent) {
			share = share.multiply(ancestor.ownShare(approach));
		}
		return Table1.tidy(share);
	}

	/** The economic interest through the chain: this entity's interest times each parent's. */
	public BigDecimal effectiveEconomicInterestPercent() {
		var interest = economicInterestPercent;
		for (var ancestor = parent; ancestor != null; ancestor = ancestor.parent) {
			interest = interest.multiply(ancestor.economicInterestPercent).movePointLeft(2);
		}
		return interest.setScale(2, RoundingMode.HALF_UP).stripTrailingZeros().scale() < 0
				? interest.setScale(0, RoundingMode.HALF_UP) : interest.setScale(2, RoundingMode.HALF_UP);
	}

	/** The parents' names from the nearest parent up to the reporting company; empty when held directly. */
	public List<String> chain() {
		var names = new ArrayList<String>();
		for (var ancestor = parent; ancestor != null; ancestor = ancestor.parent) {
			names.add(ancestor.name);
		}
		return names;
	}

	/** Whether the candidate is this entity or one of its descendants' ancestors would loop through it. */
	boolean isOrDescendsFrom(LegalEntity candidate) {
		for (var current = this; current != null; current = current.parent) {
			if (current.id.equals(candidate.id)) {
				return true;
			}
		}
		return false;
	}
}
