package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

/**
 * One legal entity's membership in one inventory's organizational boundary
 * (spec 03.1): the Table 1 facts as this inventory decides them (prefilled
 * from the entity), the facilities of the entity that are included, and the
 * membership window (spec 03.2). The same entity can be treated differently by
 * different inventories.
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
	@JoinColumn(name = "entity_id", nullable = false)
	private LegalEntity entity;

	@Enumerated(EnumType.STRING)
	@Column(name = "relationship_type", nullable = false, length = 30)
	private RelationshipType relationshipType;

	@Column(name = "economic_interest_percent", nullable = false, precision = 5, scale = 2)
	private BigDecimal economicInterestPercent;

	@Column(name = "operated_by_company", nullable = false)
	private boolean operatedByCompany;

	// financial control of a franchise (spec 03.3); implied by every other row
	@Column(name = "controlled_by_company", nullable = false)
	private boolean controlledByCompany;

	@Column(name = "effective_from")
	private LocalDate effectiveFrom;

	@Column(name = "effective_to")
	private LocalDate effectiveTo;

	// the financial-control decision copied from the entity (spec 03.4)
	@Column(name = "financial_control_override")
	private Boolean financialControlOverride;

	@OneToMany(mappedBy = "treatment", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<BoundaryFacility> facilities = new ArrayList<>();

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected BoundaryTreatment() {
	}

	/** A treatment prefilled from the entity's facts, with no facilities yet. */
	BoundaryTreatment(Inventory inventory, LegalEntity entity) {
		this.id = UUID.randomUUID();
		this.inventory = inventory;
		this.entity = entity;
		this.relationshipType = entity.getRelationshipType();
		this.economicInterestPercent = entity.getEconomicInterestPercent();
		this.operatedByCompany = entity.isOperatedByCompany();
		this.controlledByCompany = entity.isControlledByCompany();
		this.financialControlOverride = entity.getFinancialControlOverride();
		// spec 03.4: the membership window defaults to the entity's effective dates
		this.effectiveFrom = entity.getEffectiveFrom();
		this.effectiveTo = entity.getEffectiveTo();
	}

	public Boolean getFinancialControlOverride() {
		return financialControlOverride;
	}

	void setFinancialControlOverride(Boolean financialControlOverride) {
		this.financialControlOverride = financialControlOverride;
	}

	public UUID getId() {
		return id;
	}

	public Inventory getInventory() {
		return inventory;
	}

	public LegalEntity getEntity() {
		return entity;
	}

	public RelationshipType getRelationshipType() {
		return relationshipType;
	}

	public BigDecimal getEconomicInterestPercent() {
		return economicInterestPercent;
	}

	public boolean isOperatedByCompany() {
		return operatedByCompany;
	}

	public boolean isControlledByCompany() {
		return controlledByCompany;
	}

	public LocalDate getEffectiveFrom() {
		return effectiveFrom;
	}

	public LocalDate getEffectiveTo() {
		return effectiveTo;
	}

	public List<BoundaryFacility> getFacilities() {
		return List.copyOf(facilities);
	}

	void update(RelationshipType relationshipType, BigDecimal economicInterestPercent, boolean operatedByCompany,
			boolean controlledByCompany, LocalDate effectiveFrom, LocalDate effectiveTo) {
		this.relationshipType = relationshipType;
		this.economicInterestPercent = economicInterestPercent;
		this.operatedByCompany = operatedByCompany;
		this.controlledByCompany = controlledByCompany;
		this.effectiveFrom = effectiveFrom;
		this.effectiveTo = effectiveTo;
	}

	public boolean includes(UUID facilityId) {
		return facilities.stream().anyMatch(member -> member.getFacility().getId().equals(facilityId));
	}

	Optional<BoundaryFacility> member(UUID facilityId) {
		return facilities.stream().filter(member -> member.getFacility().getId().equals(facilityId)).findFirst();
	}

	void includeFacility(Facility facility) {
		if (!includes(facility.getId())) {
			facilities.add(new BoundaryFacility(this, facility));
		}
	}

	void removeFacility(UUID facilityId) {
		facilities.removeIf(member -> member.getFacility().getId().equals(facilityId));
	}

	/** This entity's own Table 1 row under the approach, before the chain of parents (spec 03.3). */
	public BigDecimal ownShare(ConsolidationApproach approach) {
		return Table1.share(relationshipType, approach, economicInterestPercent, operatedByCompany,
				controlledByCompany, financialControlOverride);
	}

	/**
	 * Fraction of the entity's emissions this inventory accounts for: the own
	 * row times the chain factor, the product of the parents' shares under the
	 * same approach as {@link InventoryService} resolves them.
	 */
	public BigDecimal accountingShare(ConsolidationApproach approach, BigDecimal chainFactor) {
		return Table1.tidy(ownShare(approach).multiply(chainFactor));
	}

	/** Whether the membership window covers a date; an absent bound is unbounded. */
	boolean covers(LocalDate date) {
		return (effectiveFrom == null || !date.isBefore(effectiveFrom))
				&& (effectiveTo == null || !date.isAfter(effectiveTo));
	}

	/** Whether the membership window overlaps a period at all (spec 04.2). */
	boolean overlaps(LocalDate start, LocalDate end) {
		return new DatePeriod(start, end).overlaps(effectiveFrom, effectiveTo);
	}

	/** Whether the window starts or ends inside the period, i.e. the membership is partial. */
	boolean isPartialWithin(LocalDate periodStart, LocalDate periodEnd) {
		return (effectiveFrom != null && effectiveFrom.isAfter(periodStart))
				|| (effectiveTo != null && effectiveTo.isBefore(periodEnd));
	}

	/** The window in words, e.g. "member from 2025-07-01", or null when unbounded. */
	String describeWindow() {
		return describeWindow(effectiveFrom, effectiveTo);
	}

	static String describeWindow(LocalDate from, LocalDate to) {
		if (from == null && to == null) {
			return null;
		}
		if (to == null) {
			return "member from " + from;
		}
		if (from == null) {
			return "member until " + to;
		}
		return "member from " + from + " until " + to;
	}
}
