package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
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
	private final SourceStreamRepository streams;
	private final GhgRunLineRepository runLines;
	private final GhgAccess access;

	GhgService(OrganizationRepository organizations, LegalEntityRepository entities, FacilityRepository facilities,
			EmissionFactorRepository emissionFactors, ActivityRecordRepository activities,
			SourceStreamRepository streams, GhgRunLineRepository runLines, GhgAccess access) {
		this.organizations = organizations;
		this.entities = entities;
		this.facilities = facilities;
		this.emissionFactors = emissionFactors;
		this.activities = activities;
		this.streams = streams;
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
		return createOrganization(name, null, null);
	}

	public Organization createOrganization(String name, String address, String contact) {
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
		organization.setHeader(trimToNull(address), trimToNull(contact));
		entities.save(new LegalEntity(organization, trimmed, RelationshipType.SUBSIDIARY, new BigDecimal("100.00"),
				new BigDecimal("100.00"), true, true, null, true));
		return organization;
	}

	public Organization updateOrganization(UUID id, String name, String address, String contact) {
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
		organization.setHeader(trimToNull(address), trimToNull(contact));
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
	public Facility createFacility(UUID organizationId, UUID entityId, String name, String location,
			String country) {
		var organization = getOrganization(organizationId);
		var entity = requireEntityInOrganization(entityId, organizationId);
		return facilities.save(new Facility(organization, entity, name.trim(), location.trim(), country(country)));
	}

	public Facility updateFacility(UUID id, UUID entityId, String name, String location, String country) {
		var facility = getFacility(id);
		var entity = requireEntityInOrganization(entityId, facility.getOrganization().getId());
		facility.update(entity, name.trim(), location.trim(), country(country));
		return facility;
	}

	/** An ISO 3166-1 alpha-2 code, upper-cased, or null (spec 07.4). */
	private static String country(String value) {
		var trimmed = trimToNull(value);
		return trimmed == null ? null : trimmed.toUpperCase(Locale.ROOT);
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

	// --- source streams (spec 04.3) ----------------------------------------------

	@Transactional(readOnly = true)
	public List<SourceStream> listStreams(UUID organizationId) {
		getOrganization(organizationId);
		return streams.findAllByFacilityOrganizationIdOrderByNameAsc(organizationId);
	}

	@Transactional(readOnly = true)
	public List<SourceStream> listStreamsOfFacility(UUID facilityId) {
		getFacility(facilityId);
		return streams.findAllByFacilityIdOrderByNameAsc(facilityId);
	}

	/** The facts of a stream as a request states them. */
	public record StreamFacts(String name, StreamKind kind, String fuel, String meterOrSupplier,
			boolean contractorOperated, String note) {
	}

	public SourceStream createStream(UUID facilityId, StreamFacts facts) {
		var facility = getFacility(facilityId);
		var trimmed = facts.name().trim();
		if (streams.existsByFacilityIdAndNameIgnoreCase(facilityId, trimmed)) {
			throw new GhgRuleViolationException("'" + facility.getName() + "' already has a stream named '" + trimmed + "'.");
		}
		return streams.save(new SourceStream(facility, trimmed, facts.kind(), trimToNull(facts.fuel()),
				trimToNull(facts.meterOrSupplier()), facts.contractorOperated(), trimToNull(facts.note())));
	}

	public SourceStream updateStream(UUID id, StreamFacts facts) {
		var stream = getStream(id);
		var trimmed = facts.name().trim();
		if (!trimmed.equalsIgnoreCase(stream.getName())
				&& streams.existsByFacilityIdAndNameIgnoreCase(stream.getFacility().getId(), trimmed)) {
			throw new GhgRuleViolationException("'" + stream.getFacility().getName() + "' already has a stream named '"
					+ trimmed + "'.");
		}
		stream.update(trimmed, facts.kind(), trimToNull(facts.fuel()), trimToNull(facts.meterOrSupplier()),
				facts.contractorOperated(), trimToNull(facts.note()));
		return stream;
	}

	/** A stream with records is part of the register the facts are filed under; it cannot be deleted. */
	public void deleteStream(UUID id) {
		var stream = getStream(id);
		if (activities.existsByStreamId(id)) {
			throw new GhgRuleViolationException("'" + stream.getName()
					+ "' has activity records. Move them to another stream before deleting it.");
		}
		streams.delete(stream);
	}

	private SourceStream getStream(UUID id) {
		var stream = streams.findById(id).orElseThrow(() -> GhgNotFoundException.stream(id));
		access.check(stream.getFacility().getOrganization());
		return stream;
	}

	/** The stream a record names must belong to the record's facility. */
	private SourceStream requireStreamOfFacility(UUID streamId, Facility facility) {
		if (streamId == null) {
			return null;
		}
		var stream = streams.findById(streamId).orElseThrow(() -> GhgNotFoundException.stream(streamId));
		if (!stream.getFacility().getId().equals(facility.getId())) {
			throw new GhgRuleViolationException("The stream '" + stream.getName() + "' belongs to '"
					+ stream.getFacility().getName() + "', not to '" + facility.getName() + "'.");
		}
		return stream;
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
		return activities.findAllByFacilityOrganizationIdOrderByPeriodEndDesc(organizationId);
	}

	public ActivityRecord createActivity(UUID organizationId, UUID facilityId, UUID streamId, String activityType,
			BigDecimal quantity, String unit, LocalDate periodStart, LocalDate periodEnd, String dataSource,
			String evidenceRef, DataQuality dataQuality, String note) {
		getOrganization(organizationId);
		var facility = requireFacilityInOrganization(facilityId, organizationId);
		requirePeriod(periodStart, periodEnd);
		return activities.save(new ActivityRecord(facility, requireStreamOfFacility(streamId, facility),
				activityType.trim(), quantity, unit.trim(), periodStart, periodEnd, trimToNull(dataSource),
				trimToNull(evidenceRef), dataQuality, trimToNull(note)));
	}

	/**
	 * CORRECT-01: corrections to facts edit the record in place. Past runs are
	 * unaffected (they snapshot); inventory views see the corrected fact and
	 * their validation gates re-evaluate against it.
	 */
	public ActivityRecord updateActivity(UUID id, UUID facilityId, UUID streamId, String activityType,
			BigDecimal quantity, String unit, LocalDate periodStart, LocalDate periodEnd, String dataSource,
			String evidenceRef, DataQuality dataQuality, String note) {
		var activity = getActivity(id);
		var organizationId = activity.getFacility().getOrganization().getId();
		var facility = requireFacilityInOrganization(facilityId, organizationId);
		requirePeriod(periodStart, periodEnd);
		activity.update(facility, requireStreamOfFacility(streamId, facility), activityType.trim(), quantity,
				unit.trim(), periodStart, periodEnd, trimToNull(dataSource), trimToNull(evidenceRef), dataQuality,
				trimToNull(note));
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

	/** A record's period end may not precede its start (spec 04.2). */
	private static void requirePeriod(LocalDate start, LocalDate end) {
		if (end.isBefore(start)) {
			throw new InvalidPeriodException();
		}
	}

	private static String trimToNull(String value) {
		if (value == null || value.trim().isEmpty()) {
			return null;
		}
		return value.trim();
	}
}
