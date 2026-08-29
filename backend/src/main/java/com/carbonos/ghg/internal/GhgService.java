package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carbonos.ghg.GhgRunCompleted;

@Service
@Transactional
public class GhgService {

	private final OrganizationRepository organizations;
	private final FacilityRepository facilities;
	private final EmissionFactorRepository emissionFactors;
	private final ActivityRecordRepository activities;
	private final GhgRunRepository runs;
	private final ApplicationEventPublisher events;

	GhgService(OrganizationRepository organizations, FacilityRepository facilities,
			EmissionFactorRepository emissionFactors, ActivityRecordRepository activities, GhgRunRepository runs,
			ApplicationEventPublisher events) {
		this.organizations = organizations;
		this.facilities = facilities;
		this.emissionFactors = emissionFactors;
		this.activities = activities;
		this.runs = runs;
		this.events = events;
	}

	// --- organizations -----------------------------------------------------

	@Transactional(readOnly = true)
	public List<Organization> listOrganizations() {
		return organizations.findAllByOrderByCreatedAtAsc();
	}

	@Transactional(readOnly = true)
	public Organization getOrganization(UUID id) {
		return organizations.findById(id).orElseThrow(() -> GhgNotFoundException.organization(id));
	}

	public Organization createOrganization(String name, ConsolidationApproach approach) {
		var trimmed = name.trim();
		if (organizations.existsByNameIgnoreCase(trimmed)) {
			throw new DuplicateOrganizationException(trimmed);
		}
		try {
			return organizations.saveAndFlush(new Organization(trimmed, approach));
		}
		catch (DataIntegrityViolationException ex) {
			// unique-constraint race between the existence check and the insert
			throw new DuplicateOrganizationException(trimmed);
		}
	}

	public Organization updateOrganization(UUID id, String name, ConsolidationApproach approach) {
		var organization = getOrganization(id);
		var trimmed = name.trim();
		if (!trimmed.equalsIgnoreCase(organization.getName()) && organizations.existsByNameIgnoreCase(trimmed)) {
			throw new DuplicateOrganizationException(trimmed);
		}
		organization.setName(trimmed);
		organization.setConsolidationApproach(approach);
		return organization;
	}

	public void deleteOrganization(UUID id) {
		organizations.delete(getOrganization(id));
	}

	@Transactional(readOnly = true)
	public long facilityCount(UUID organizationId) {
		return facilities.countByOrganizationId(organizationId);
	}

	// --- facilities (organizational boundary) ------------------------------

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
		var facility = facilities.findById(id).orElseThrow(() -> GhgNotFoundException.facility(id));
		facility.setName(name.trim());
		facility.setLocation(location.trim());
		facility.setEquitySharePercent(equitySharePercent);
		facility.setControlled(controlled);
		return facility;
	}

	public void deleteFacility(UUID id) {
		var facility = facilities.findById(id).orElseThrow(() -> GhgNotFoundException.facility(id));
		facilities.delete(facility);
	}

	// --- emission factors ---------------------------------------------------

	@Transactional(readOnly = true)
	public List<EmissionFactor> listEmissionFactors() {
		return emissionFactors.findAllByOrderByScopeAscNameAsc();
	}

	// --- activity data ------------------------------------------------------

	@Transactional(readOnly = true)
	public List<ActivityRecord> listActivities(UUID organizationId) {
		getOrganization(organizationId);
		return activities.findAllByFacilityOrganizationIdOrderByActivityDateDesc(organizationId);
	}

	public ActivityRecord createActivity(UUID organizationId, UUID facilityId, UUID emissionFactorId,
			BigDecimal quantity, LocalDate activityDate, String note) {
		var facility = facilities.findById(facilityId).orElseThrow(() -> GhgNotFoundException.facility(facilityId));
		if (!facility.getOrganization().getId().equals(organizationId)) {
			throw GhgNotFoundException.facility(facilityId);
		}
		var factor = emissionFactors.findById(emissionFactorId)
			.orElseThrow(() -> GhgNotFoundException.emissionFactor(emissionFactorId));
		return activities.save(new ActivityRecord(facility, factor, quantity, activityDate, note));
	}

	public void deleteActivity(UUID id) {
		var activity = activities.findById(id).orElseThrow(() -> GhgNotFoundException.activity(id));
		activities.delete(activity);
	}

	// --- calculation runs ---------------------------------------------------

	@Transactional(readOnly = true)
	public List<GhgRun> listRuns(UUID organizationId) {
		getOrganization(organizationId);
		return runs.findAllByOrganizationIdOrderByCreatedAtDesc(organizationId);
	}

	@Transactional(readOnly = true)
	public GhgRun getRun(UUID id) {
		return runs.findWithLinesById(id).orElseThrow(() -> GhgNotFoundException.run(id));
	}

	/**
	 * Rolls the organization's activity data in the period up to CO2e. Each
	 * activity is weighted by its facility's share under the organization's
	 * consolidation approach (equity percentage, or all-or-nothing control),
	 * and every input is snapshotted onto the run's lines.
	 */
	public GhgRun executeRun(UUID organizationId, String label, LocalDate periodStart, LocalDate periodEnd) {
		if (periodEnd.isBefore(periodStart)) {
			throw new InvalidPeriodException();
		}
		var organization = getOrganization(organizationId);
		var run = new GhgRun(organization, label.trim(), periodStart, periodEnd);
		var approach = organization.getConsolidationApproach();
		for (var activity : activities.findAllByFacilityOrganizationIdAndActivityDateBetween(organizationId,
				periodStart, periodEnd)) {
			var weight = activity.getFacility().consolidationWeight(approach);
			var kgCo2e = activity.getQuantity()
				.multiply(activity.getEmissionFactor().getKgCo2ePerUnit())
				.multiply(weight)
				.setScale(3, RoundingMode.HALF_UP);
			run.addLine(new GhgRunLine(run, activity, weight, kgCo2e));
		}
		run = runs.save(run);
		events.publishEvent(new GhgRunCompleted(run.getId(), organizationId, run.getTotalKgCo2e()));
		return run;
	}

	public void deleteRun(UUID id) {
		runs.delete(getRun(id));
	}
}
