package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

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
 * One entity as a {@link BoundaryVersion} recorded it: the Table 1 facts, the
 * derived share, the membership window, the facilities beneath it, and, when
 * the share was zero, the fact that it stood outside the boundary under the
 * approach. Names are copied so the entry stays readable after edits.
 */
@Entity
@Table(name = "ghg_boundary_version_entries")
public class BoundaryVersionEntry {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "boundary_version_id", nullable = false)
	private BoundaryVersion version;

	@Column(name = "entity_id", nullable = false)
	private UUID entityId;

	@Column(name = "entity_name", nullable = false, length = 120)
	private String entityName;

	@Enumerated(EnumType.STRING)
	@Column(name = "relationship_type", nullable = false, length = 30)
	private RelationshipType relationshipType;

	@Column(name = "economic_interest_percent", nullable = false, precision = 5, scale = 2)
	private BigDecimal economicInterestPercent;

	@Column(name = "operated_by_company", nullable = false)
	private boolean operatedByCompany;

	@Column(name = "controlled_by_company", nullable = false)
	private boolean controlledByCompany;

	// the interest through the chain of parents, and the parents' names copied (spec 03.3)
	@Column(name = "effective_economic_interest_percent", nullable = false, precision = 5, scale = 2)
	private BigDecimal effectiveEconomicInterestPercent;

	@Column(name = "chain_names", length = 1000)
	private String chainNames;

	@Column(name = "accounting_share", nullable = false, precision = 7, scale = 4)
	private BigDecimal accountingShare;

	@Column(name = "effective_from")
	private LocalDate effectiveFrom;

	@Column(name = "effective_to")
	private LocalDate effectiveTo;

	@Column(nullable = false)
	private boolean excluded;

	@Column(name = "exclusion_reason", length = 255)
	private String exclusionReason;

	// a Set, not a List: Hibernate cannot join-fetch two bags (entries and their
	// facilities) in one query, and the version is read with both
	@OneToMany(mappedBy = "entry", cascade = CascadeType.ALL, orphanRemoval = true)
	private Set<BoundaryVersionFacility> facilities = new LinkedHashSet<>();

	protected BoundaryVersionEntry() {
	}

	BoundaryVersionEntry(BoundaryVersion version, BoundaryTreatment treatment, ConsolidationApproach approach,
			EntityChain chain) {
		this.id = UUID.randomUUID();
		this.version = version;
		this.entityId = treatment.getEntity().getId();
		this.entityName = treatment.getEntity().getName();
		this.relationshipType = treatment.getRelationshipType();
		this.economicInterestPercent = treatment.getEconomicInterestPercent();
		this.operatedByCompany = treatment.isOperatedByCompany();
		this.controlledByCompany = treatment.isControlledByCompany();
		this.effectiveEconomicInterestPercent = chain.effectiveInterestPercent(treatment.getEconomicInterestPercent());
		this.chainNames = chain.names().isEmpty() ? null : String.join(" > ", chain.names());
		this.accountingShare = treatment.accountingShare(approach, chain.shareFactor());
		this.effectiveFrom = treatment.getEffectiveFrom();
		this.effectiveTo = treatment.getEffectiveTo();
		this.excluded = accountingShare.signum() == 0;
		this.exclusionReason = excluded ? "0% accounting share under "
				+ approach.name().toLowerCase().replace('_', ' ') + ": outside the boundary under this approach"
				: null;
		for (var member : treatment.getFacilities()) {
			facilities.add(new BoundaryVersionFacility(this, member.getFacility()));
		}
	}

	boolean holds(UUID facilityId) {
		return facilities.stream().anyMatch(facility -> facility.getFacilityId().equals(facilityId));
	}

	boolean covers(LocalDate date) {
		return (effectiveFrom == null || !date.isBefore(effectiveFrom))
				&& (effectiveTo == null || !date.isAfter(effectiveTo));
	}

	public UUID getId() {
		return id;
	}

	public UUID getEntityId() {
		return entityId;
	}

	public String getEntityName() {
		return entityName;
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

	public BigDecimal getEffectiveEconomicInterestPercent() {
		return effectiveEconomicInterestPercent;
	}

	/** The parents' names from the nearest parent up to the reporting company, as frozen. */
	public List<String> getChain() {
		return chainNames == null ? List.of() : List.of(chainNames.split(" > "));
	}

	public BigDecimal getAccountingShare() {
		return accountingShare;
	}

	public LocalDate getEffectiveFrom() {
		return effectiveFrom;
	}

	public LocalDate getEffectiveTo() {
		return effectiveTo;
	}

	public boolean isExcluded() {
		return excluded;
	}

	public String getExclusionReason() {
		return exclusionReason;
	}

	public List<BoundaryVersionFacility> getFacilities() {
		return facilities.stream().sorted(Comparator.comparing(BoundaryVersionFacility::getFacilityName)).toList();
	}
}
