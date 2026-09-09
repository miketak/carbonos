package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The organizational-facts side of spec 02 and spec 03.1: organizations,
 * their legal entities and facilities, the emission-factor library, and
 * activity records. Accounting views live in {@link InventoryService}. Every
 * entry is tenant-checked via {@link GhgAccess} (spec 01).
 */
@Service
@Transactional
public class GhgService {

	private final OrganizationRepository organizations;
	private final LegalEntityRepository entities;
	private final FacilityRepository facilities;
	private final EmissionFactorRepository emissionFactors;
	private final ActivityRecordRepository activities;
	private final GhgRunLineRepository runLines;
	private final GhgAccess access;

	GhgService(OrganizationRepository organizations, LegalEntityRepository entities, FacilityRepository facilities,
			EmissionFactorRepository emissionFactors, ActivityRecordRepository activities,
			GhgRunLineRepository runLines, GhgAccess access) {
		this.organizations = organizations;
		this.entities = entities;
		this.facilities = facilities;
		this.emissionFactors = emissionFactors;
		this.activities = activities;
		this.runLines = runLines;
		this.access = access;
	}

	// --- organizations -----------------------------------------------------

	@Transactional(readOnly = true)
	public List<Organization> listOrganizations() {
		if (access.isCurrentUserAdmin()) {
			return organizations.findAllByOrderByCreatedAtAsc();
		}
		return organizations.findAllByOwnerUserIdOrderByCreatedAtAsc(access.currentUserId());
	}

	@Transactional(readOnly = true)
	public Organization getOrganization(UUID id) {
		var organization = organizations.findById(id).orElseThrow(() -> GhgNotFoundException.organization(id));
		access.check(organization);
		return organization;
	}

	/** Creates the organization and its own legal entity, the wholly owned reporting company (spec 03.1). */
	public Organization createOrganization(String name) {
		var trimmed = name.trim();
		if (organizations.existsByNameIgnoreCase(trimmed)) {
			throw new DuplicateOrganizationException(trimmed);
		}
		Organization organization;
		try {
			organization = organizations.saveAndFlush(new Organization(trimmed, access.currentUserId()));
		}
		catch (DataIntegrityViolationException ex) {
			// unique-constraint race between the existence check and the insert
			throw new DuplicateOrganizationException(trimmed);
		}
		entities.save(new LegalEntity(organization, trimmed, RelationshipType.SUBSIDIARY, new BigDecimal("100.00"),
				new BigDecimal("100.00"), true, true, null, true));
		return organization;
	}

	public Organization updateOrganization(UUID id, String name) {
		var organization = getOrganization(id);
		var trimmed = name.trim();
		if (!trimmed.equalsIgnoreCase(organization.getName()) && organizations.existsByNameIgnoreCase(trimmed)) {
			throw new DuplicateOrganizationException(trimmed);
		}
		// the reporting company's entity follows the organization's name unless it was renamed by hand
		entities.findByOrganizationIdAndReportingCompanyTrue(id)
			.filter(own -> own.getName().equals(organization.getName()))
			.ifPresent(own -> own.setName(trimmed));
		organization.setName(trimmed);
		return organization;
	}

	public void deleteOrganization(UUID id) {
		organizations.delete(getOrganization(id));
	}

	@Transactional(readOnly = true)
	public long facilityCount(UUID organizationId) {
		return facilities.countByOrganizationId(organizationId);
	}

	// --- legal entities (spec 03.1) ------------------------------------------

	@Transactional(readOnly = true)
	public List<LegalEntity> listEntities(UUID organizationId) {
		getOrganization(organizationId);
		return entities.findAllByOrganizationIdOrderByReportingCompanyDescCreatedAtAsc(organizationId);
	}

	@Transactional(readOnly = true)
	public LegalEntity getEntity(UUID id) {
		var entity = entities.findById(id).orElseThrow(() -> GhgNotFoundException.entity(id));
		access.check(entity.getOrganization());
		return entity;
	}

	/** The facts of an entity as a request states them (spec 03.1, 03.3). */
	public record EntityFacts(String name, RelationshipType relationshipType, BigDecimal economicInterestPercent,
			BigDecimal legalOwnershipPercent, boolean operatedByCompany, Boolean controlledByCompany,
			UUID parentEntityId) {
	}

	public LegalEntity createEntity(UUID organizationId, EntityFacts facts) {
		var organization = getOrganization(organizationId);
		var trimmed = facts.name().trim();
		if (entities.existsByOrganizationIdAndNameIgnoreCase(organizationId, trimmed)) {
			throw new GhgRuleViolationException("An entity named '" + trimmed + "' already exists.");
		}
		var parent = requireParent(facts.parentEntityId(), organizationId, null);
		return entities.save(new LegalEntity(organization, trimmed, facts.relationshipType(),
				facts.economicInterestPercent(), facts.legalOwnershipPercent(), facts.operatedByCompany(),
				controlFlag(facts), parent, false));
	}

	/** Financial control is a fact only for franchises (spec 03.3); every other row implies it or rules it out. */
	private static boolean controlFlag(EntityFacts facts) {
		if (facts.relationshipType() != RelationshipType.FRANCHISE) {
			if (facts.controlledByCompany() != null) {
				throw new GhgRuleViolationException(
						"controlledByCompany is recorded for franchises only; Table 1 settles control for "
								+ facts.relationshipType().name().toLowerCase().replace('_', ' ') + ".");
			}
			return facts.relationshipType() == RelationshipType.SUBSIDIARY;
		}
		return Boolean.TRUE.equals(facts.controlledByCompany());
	}

	/** The parent the company holds this entity through: same organization, no cycle, never the reporting company's parent. */
	private LegalEntity requireParent(UUID parentEntityId, UUID organizationId, LegalEntity self) {
		if (parentEntityId == null) {
			return null;
		}
		var parent = entities.findById(parentEntityId)
			.orElseThrow(() -> GhgNotFoundException.entity(parentEntityId));
		if (!parent.getOrganization().getId().equals(organizationId)) {
			throw GhgNotFoundException.entity(parentEntityId);
		}
		if (self != null && parent.isOrDescendsFrom(self)) {
			throw new GhgRuleViolationException("'" + parent.getName() + "' is held through '" + self.getName()
					+ "': a parent chain cannot loop.");
		}
		return parent;
	}

	/**
	 * Edits the entity's facts only. Existing boundary treatments are decisions
	 * and stay as they are (spec 03); the BOUNDARY gate reports the drift.
	 */
	public LegalEntity updateEntity(UUID id, EntityFacts facts) {
		var entity = getEntity(id);
		var trimmed = facts.name().trim();
		if (entity.isReportingCompany() && (facts.relationshipType() != RelationshipType.SUBSIDIARY
				|| facts.economicInterestPercent().compareTo(new BigDecimal("100")) != 0
				|| !facts.operatedByCompany() || facts.parentEntityId() != null)) {
			throw new GhgRuleViolationException("The reporting company is the group's own wholly owned operation "
					+ "by definition. Record other structures as separate entities.");
		}
		if (!trimmed.equalsIgnoreCase(entity.getName())
				&& entities.existsByOrganizationIdAndNameIgnoreCase(entity.getOrganization().getId(), trimmed)) {
			throw new GhgRuleViolationException("An entity named '" + trimmed + "' already exists.");
		}
		var parent = requireParent(facts.parentEntityId(), entity.getOrganization().getId(), entity);
		entity.update(trimmed, facts.relationshipType(), facts.economicInterestPercent(),
				facts.legalOwnershipPercent(), facts.operatedByCompany(), controlFlag(facts), parent);
		return entity;
	}

	public void deleteEntity(UUID id) {
		var entity = getEntity(id);
		if (entity.isReportingCompany()) {
			throw new GhgRuleViolationException("The reporting company cannot be deleted.");
		}
		if (facilities.existsByEntityId(id)) {
			throw new GhgRuleViolationException("'" + entity.getName()
					+ "' still has facilities. Move them to another entity before deleting it.");
		}
		if (entities.existsByParentId(id)) {
			throw new GhgRuleViolationException("'" + entity.getName()
					+ "' is the parent of other entities. Re-parent them before deleting it.");
		}
		entities.delete(entity);
	}

	// --- facilities ---------------------------------------------------------

	@Transactional(readOnly = true)
	public List<Facility> listFacilities(UUID organizationId) {
		getOrganization(organizationId);
		return facilities.findAllByOrganizationIdOrderByCreatedAtAsc(organizationId);
	}

	/** Adds a facility under an entity; without one it belongs to the reporting company (spec 03.1). */
	public Facility createFacility(UUID organizationId, UUID entityId, String name, String location) {
		var organization = getOrganization(organizationId);
		var entity = requireEntityInOrganization(entityId, organizationId);
		return facilities.save(new Facility(organization, entity, name.trim(), location.trim()));
	}

	public Facility updateFacility(UUID id, UUID entityId, String name, String location) {
		var facility = getFacility(id);
		var entity = requireEntityInOrganization(entityId, facility.getOrganization().getId());
		facility.update(entity, name.trim(), location.trim());
		return facility;
	}

	/** TRACE-02: a facility with recorded facts is history; it cannot be deleted. */
	public void deleteFacility(UUID id) {
		var facility = getFacility(id);
		if (activities.existsByFacilityId(id)) {
			throw new GhgRuleViolationException(
					"'" + facility.getName() + "' has recorded activity data. Facts are the audit trail: "
							+ "remove or reassign its activity records before deleting the facility.");
		}
		facilities.delete(facility);
	}

	// --- emission factors ---------------------------------------------------

	@Transactional(readOnly = true)
	public List<EmissionFactor> listEmissionFactors() {
		return emissionFactors.findAllByOrderByDefaultScopeAscNameAsc();
	}

	// --- activity data (organizational facts) -------------------------------

	@Transactional(readOnly = true)
	public List<ActivityRecord> listActivities(UUID organizationId) {
		getOrganization(organizationId);
		return activities.findAllByFacilityOrganizationIdOrderByActivityDateDesc(organizationId);
	}

	public ActivityRecord createActivity(UUID organizationId, UUID facilityId, String activityType,
			BigDecimal quantity, String unit, LocalDate activityDate, String dataSource, String evidenceRef,
			DataQuality dataQuality, String note) {
		getOrganization(organizationId);
		var facility = requireFacilityInOrganization(facilityId, organizationId);
		return activities.save(new ActivityRecord(facility, activityType.trim(), quantity, unit.trim(), activityDate,
				trimToNull(dataSource), trimToNull(evidenceRef), dataQuality, trimToNull(note)));
	}

	/**
	 * CORRECT-01: corrections to facts edit the record in place. Past runs are
	 * unaffected (they snapshot); inventory views see the corrected fact and
	 * their validation gates re-evaluate against it.
	 */
	public ActivityRecord updateActivity(UUID id, UUID facilityId, String activityType, BigDecimal quantity,
			String unit, LocalDate activityDate, String dataSource, String evidenceRef, DataQuality dataQuality,
			String note) {
		var activity = getActivity(id);
		var organizationId = activity.getFacility().getOrganization().getId();
		var facility = requireFacilityInOrganization(facilityId, organizationId);
		activity.update(facility, activityType.trim(), quantity, unit.trim(), activityDate, trimToNull(dataSource),
				trimToNull(evidenceRef), dataQuality, trimToNull(note));
		return activity;
	}

	/** TRACE-01: a fact referenced by a calculation run is audit trail; it cannot be deleted. */
	public void deleteActivity(UUID id) {
		var activity = getActivity(id);
		if (runLines.existsByActivityId(id)) {
			throw new GhgRuleViolationException(
					"This record has been calculated into one or more runs. Reported results must stay "
							+ "traceable to their source: correct the record instead of deleting it.");
		}
		activities.delete(activity);
	}

	// --- helpers -------------------------------------------------------------

	private Facility getFacility(UUID id) {
		var facility = facilities.findById(id).orElseThrow(() -> GhgNotFoundException.facility(id));
		access.check(facility.getOrganization());
		return facility;
	}

	private ActivityRecord getActivity(UUID id) {
		var activity = activities.findById(id).orElseThrow(() -> GhgNotFoundException.activity(id));
		access.check(activity.getFacility().getOrganization());
		return activity;
	}

	private Facility requireFacilityInOrganization(UUID facilityId, UUID organizationId) {
		var facility = facilities.findById(facilityId).orElseThrow(() -> GhgNotFoundException.facility(facilityId));
		if (!facility.getOrganization().getId().equals(organizationId)) {
			throw GhgNotFoundException.facility(facilityId);
		}
		return facility;
	}

	private LegalEntity requireEntityInOrganization(UUID entityId, UUID organizationId) {
		if (entityId == null) {
			return entities.findByOrganizationIdAndReportingCompanyTrue(organizationId)
				.orElseThrow(() -> new IllegalStateException("Organization " + organizationId + " has no own entity"));
		}
		var entity = entities.findById(entityId).orElseThrow(() -> GhgNotFoundException.entity(entityId));
		if (!entity.getOrganization().getId().equals(organizationId)) {
			throw GhgNotFoundException.entity(entityId);
		}
		return entity;
	}

	private static String trimToNull(String value) {
		if (value == null || value.trim().isEmpty()) {
			return null;
		}
		return value.trim();
	}
}
