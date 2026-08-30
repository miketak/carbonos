package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The organizational-facts side of spec 003: organizations, facilities, the
 * emission-factor library, and activity records. Accounting views live in
 * {@link InventoryService}. Every entry is tenant-checked via
 * {@link GhgAccess} (spec 004).
 */
@Service
@Transactional
public class GhgService {

	private final OrganizationRepository organizations;
	private final FacilityRepository facilities;
	private final EmissionFactorRepository emissionFactors;
	private final ActivityRecordRepository activities;
	private final GhgRunLineRepository runLines;
	private final GhgAccess access;

	GhgService(OrganizationRepository organizations, FacilityRepository facilities,
			EmissionFactorRepository emissionFactors, ActivityRecordRepository activities,
			GhgRunLineRepository runLines, GhgAccess access) {
		this.organizations = organizations;
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

	public Organization createOrganization(String name) {
		var trimmed = name.trim();
		if (organizations.existsByNameIgnoreCase(trimmed)) {
			throw new DuplicateOrganizationException(trimmed);
		}
		try {
			return organizations.saveAndFlush(new Organization(trimmed, access.currentUserId()));
		}
		catch (DataIntegrityViolationException ex) {
			// unique-constraint race between the existence check and the insert
			throw new DuplicateOrganizationException(trimmed);
		}
	}

	public Organization updateOrganization(UUID id, String name) {
		var organization = getOrganization(id);
		var trimmed = name.trim();
		if (!trimmed.equalsIgnoreCase(organization.getName()) && organizations.existsByNameIgnoreCase(trimmed)) {
			throw new DuplicateOrganizationException(trimmed);
		}
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

	// --- facilities ---------------------------------------------------------

	@Transactional(readOnly = true)
	public List<Facility> listFacilities(UUID organizationId) {
		getOrganization(organizationId);
		return facilities.findAllByOrganizationIdOrderByCreatedAtAsc(organizationId);
	}

	public Facility createFacility(UUID organizationId, String name, String location, BigDecimal equitySharePercent,
			boolean controlled) {
		var organization = getOrganization(organizationId);
		return facilities.save(new Facility(organization, name.trim(), location.trim(), equitySharePercent,
				controlled));
	}

	public Facility updateFacility(UUID id, String name, String location, BigDecimal equitySharePercent,
			boolean controlled) {
		var facility = getFacility(id);
		facility.setName(name.trim());
		facility.setLocation(location.trim());
		facility.setEquitySharePercent(equitySharePercent);
		facility.setControlled(controlled);
		return facility;
	}

	/** TRACE-02: a facility with recorded facts is history — it cannot be deleted. */
	public void deleteFacility(UUID id) {
		var facility = getFacility(id);
		if (activities.existsByFacilityId(id)) {
			throw new GhgRuleViolationException(
					"'" + facility.getName() + "' has recorded activity data. Facts are the audit trail — "
							+ "remove or reassign its activity records before deleting the facility.");
		}
		facilities.delete(facility);
	}

	// --- emission factors ---------------------------------------------------

	@Transactional(readOnly = true)
	public List<EmissionFactor> listEmissionFactors() {
		return emissionFactors.findAllByOrderByScopeAscNameAsc();
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

	/** TRACE-01: a fact referenced by a calculation run is audit trail — it cannot be deleted. */
	public void deleteActivity(UUID id) {
		var activity = getActivity(id);
		if (runLines.existsByActivityId(id)) {
			throw new GhgRuleViolationException(
					"This record has been calculated into one or more runs. Reported results must stay "
							+ "traceable to their source — correct the record instead of deleting it.");
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

	private static String trimToNull(String value) {
		if (value == null || value.trim().isEmpty()) {
			return null;
		}
		return value.trim();
	}
}
