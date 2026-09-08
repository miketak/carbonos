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
 * A legal entity the organization consolidates (spec 03.1): its Table 1
 * relationship type, the economic interest (which equity share reflects) and,
 * for disclosure, the legal ownership percent. Facilities belong to entities;
 * the accounting share flows down from the entity.
 */
@Entity
@Table(name = "ghg_entities")
public class LegalEntity {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "organization_id", nullable = false)
	private Organization organization;

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

	// the organization itself, wholly owned: the entity facilities default to
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
			boolean reportingCompany) {
		this.id = UUID.randomUUID();
		this.organization = organization;
		this.name = name;
		this.relationshipType = relationshipType;
		this.economicInterestPercent = economicInterestPercent;
		this.legalOwnershipPercent = legalOwnershipPercent;
		this.operatedByCompany = operatedByCompany;
		this.reportingCompany = reportingCompany;
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

	public boolean isReportingCompany() {
		return reportingCompany;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	void update(String name, RelationshipType relationshipType, BigDecimal economicInterestPercent,
			BigDecimal legalOwnershipPercent, boolean operatedByCompany) {
		this.name = name;
		this.relationshipType = relationshipType;
		this.economicInterestPercent = economicInterestPercent;
		this.legalOwnershipPercent = legalOwnershipPercent;
		this.operatedByCompany = operatedByCompany;
	}

	void setName(String name) {
		this.name = name;
	}

	/** The share Table 1 gives this entity's facts under an approach. */
	public BigDecimal share(ConsolidationApproach approach) {
		return Table1.share(relationshipType, approach, economicInterestPercent, operatedByCompany);
	}
}
