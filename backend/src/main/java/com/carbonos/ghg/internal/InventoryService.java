package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carbonos.ghg.GhgRunCompleted;
import com.carbonos.ghg.internal.Validation.Finding;
import com.carbonos.ghg.internal.Validation.Gate;
import com.carbonos.ghg.internal.Validation.GateResult;
import com.carbonos.ghg.internal.Validation.Report;
import com.carbonos.ghg.internal.Validation.Severity;

/**
 * The accounting-view side of spec 003: inventories, their boundaries and
 * activity assignments, the pre-run validation gates, and calculation runs.
 * Nothing here ever mutates an {@link ActivityRecord} (invariant 2).
 */
@Service
@Transactional
public class InventoryService {

	private final OrganizationRepository organizations;
	private final FacilityRepository facilities;
	private final ActivityRecordRepository activities;
	private final EmissionFactorRepository emissionFactors;
	private final InventoryRepository inventories;
	private final BoundaryTreatmentRepository boundaryTreatments;
	private final InventoryAssignmentRepository assignments;
	private final GhgRunRepository runs;
	private final ApplicationEventPublisher events;
	private final GhgAccess access;

	InventoryService(OrganizationRepository organizations, FacilityRepository facilities,
			ActivityRecordRepository activities, EmissionFactorRepository emissionFactors,
			InventoryRepository inventories, BoundaryTreatmentRepository boundaryTreatments,
			InventoryAssignmentRepository assignments, GhgRunRepository runs, ApplicationEventPublisher events,
			GhgAccess access) {
		this.organizations = organizations;
		this.facilities = facilities;
		this.activities = activities;
		this.emissionFactors = emissionFactors;
		this.inventories = inventories;
		this.boundaryTreatments = boundaryTreatments;
		this.assignments = assignments;
		this.runs = runs;
		this.events = events;
		this.access = access;
	}

	// --- inventories --------------------------------------------------------

	@Transactional(readOnly = true)
	public List<Inventory> list(UUID organizationId) {
		requireOrganization(organizationId);
		return inventories.findAllByOrganizationIdOrderByCreatedAtDesc(organizationId);
	}

	@Transactional(readOnly = true)
	public Inventory get(UUID id) {
		var inventory = inventories.findById(id).orElseThrow(() -> GhgNotFoundException.inventory(id));
		access.check(inventory.getOrganization());
		return inventory;
	}

	public Inventory create(UUID organizationId, String name, LocalDate periodStart, LocalDate periodEnd,
			String purpose, Integer baseYear, ConsolidationApproach approach) {
		requirePeriod(periodStart, periodEnd);
		var organization = organizations.findById(organizationId)
			.orElseThrow(() -> GhgNotFoundException.organization(organizationId));
		access.check(organization);
		return inventories.save(new Inventory(organization, name.trim(), periodStart, periodEnd, trimToNull(purpose),
				baseYear, approach));
	}

	public Inventory update(UUID id, String name, LocalDate periodStart, LocalDate periodEnd, String purpose,
			Integer baseYear, ConsolidationApproach approach) {
		requirePeriod(periodStart, periodEnd);
		var inventory = get(id);
		inventory.update(name.trim(), periodStart, periodEnd, trimToNull(purpose), baseYear, approach);
		return inventory;
	}

	public void delete(UUID id) {
		inventories.delete(get(id));
	}

	// --- organizational boundary -------------------------------------------

	@Transactional(readOnly = true)
	public List<BoundaryTreatment> boundary(UUID inventoryId) {
		get(inventoryId);
		return boundaryTreatments.findAllByInventoryId(inventoryId);
	}

	/** Adds the facility to the boundary, or updates its treatment if present. */
	public BoundaryTreatment setBoundaryTreatment(UUID inventoryId, UUID facilityId, BigDecimal ownershipPercent,
			boolean financialControl, boolean operationalControl) {
		var inventory = get(inventoryId);
		var facility = facilities.findById(facilityId).orElseThrow(() -> GhgNotFoundException.facility(facilityId));
		if (!facility.getOrganization().getId().equals(inventory.getOrganization().getId())) {
			throw GhgNotFoundException.facility(facilityId);
		}
		return boundaryTreatments.findByInventoryIdAndFacilityId(inventoryId, facilityId).map(existing -> {
			existing.update(ownershipPercent, financialControl, operationalControl);
			return existing;
		}).orElseGet(() -> boundaryTreatments
			.save(new BoundaryTreatment(inventory, facility, ownershipPercent, financialControl, operationalControl)));
	}

	public void removeBoundaryTreatment(UUID inventoryId, UUID facilityId) {
		get(inventoryId);
		var treatment = boundaryTreatments.findByInventoryIdAndFacilityId(inventoryId, facilityId)
			.orElseThrow(() -> GhgNotFoundException.facility(facilityId));
		boundaryTreatments.delete(treatment);
	}

	// --- activity assignments (the view over the facts) ---------------------

	@Transactional(readOnly = true)
	public List<InventoryAssignment> listAssignments(UUID inventoryId) {
		get(inventoryId);
		return assignments.findAllByInventoryIdOrderByCreatedAtAsc(inventoryId);
	}

	/**
	 * Reviews the organization's activity data for this inventory: creates an
	 * assignment for every unreviewed record (auto-excluding outside-period /
	 * outside-boundary ones with a documented reason), and re-evaluates
	 * earlier AUTO exclusions whose reason no longer holds — a record excluded
	 * as outside the period is re-included once the period covers it
	 * (RECON-01). Manual exclusions are never touched.
	 */
	public SyncResult syncAssignments(UUID inventoryId) {
		var inventory = get(inventoryId);
		var reviewed = assignments.findAllByInventoryIdOrderByCreatedAtAsc(inventoryId);
		var existing = reviewed.stream()
			.map(assignment -> assignment.getActivity().getId())
			.collect(java.util.stream.Collectors.toSet());
		var inBoundary = boundaryTreatments.findAllByInventoryId(inventoryId)
			.stream()
			.map(treatment -> treatment.getFacility().getId())
			.collect(java.util.stream.Collectors.toSet());

		var created = 0;
		for (var activity : activities
			.findAllByFacilityOrganizationIdOrderByActivityDateDesc(inventory.getOrganization().getId())) {
			if (existing.contains(activity.getId())) {
				continue;
			}
			var assignment = new InventoryAssignment(inventory, activity);
			applyAutoExclusion(assignment, inventory, inBoundary);
			assignments.save(assignment);
			created++;
		}

		var updated = 0;
		for (var assignment : reviewed) {
			if (assignment.isIncluded() || !isAutoReason(assignment.getExclusionReason())) {
				continue;
			}
			var stillOutsidePeriod = !inventory.covers(assignment.getActivity().getActivityDate());
			var stillOutsideBoundary = !inBoundary.contains(assignment.getActivity().getFacility().getId());
			if (!stillOutsidePeriod && !stillOutsideBoundary) {
				assignment.include();
				updated++;
			}
			else {
				var correctReason = stillOutsidePeriod ? ExclusionReason.OUTSIDE_PERIOD
						: ExclusionReason.OUTSIDE_BOUNDARY;
				if (assignment.getExclusionReason() != correctReason) {
					assignment.exclude(correctReason);
					updated++;
				}
			}
		}
		return new SyncResult(created, updated);
	}

	public record SyncResult(int created, int updated) {
	}

	private static void applyAutoExclusion(InventoryAssignment assignment, Inventory inventory,
			java.util.Set<UUID> inBoundary) {
		if (!inventory.covers(assignment.getActivity().getActivityDate())) {
			assignment.exclude(ExclusionReason.OUTSIDE_PERIOD);
		}
		else if (!inBoundary.contains(assignment.getActivity().getFacility().getId())) {
			assignment.exclude(ExclusionReason.OUTSIDE_BOUNDARY);
		}
	}

	private static boolean isAutoReason(ExclusionReason reason) {
		return reason == ExclusionReason.OUTSIDE_PERIOD || reason == ExclusionReason.OUTSIDE_BOUNDARY;
	}

	public InventoryAssignment classify(UUID assignmentId, UUID emissionFactorId) {
		var assignment = getAssignment(assignmentId);
		var factor = emissionFactors.findById(emissionFactorId)
			.orElseThrow(() -> GhgNotFoundException.emissionFactor(emissionFactorId));
		assignment.classify(factor);
		return assignment;
	}

	public InventoryAssignment exclude(UUID assignmentId, ExclusionReason reason) {
		var assignment = getAssignment(assignmentId);
		assignment.exclude(reason);
		return assignment;
	}

	public InventoryAssignment include(UUID assignmentId) {
		var assignment = getAssignment(assignmentId);
		assignment.include();
		return assignment;
	}

	// --- validation gates ----------------------------------------------------

	@Transactional(readOnly = true)
	public Report validate(UUID inventoryId) {
		var inventory = get(inventoryId);
		var boundary = boundaryTreatments.findAllByInventoryId(inventoryId);
		var allAssignments = assignments.findAllByInventoryIdOrderByCreatedAtAsc(inventoryId);
		var included = allAssignments.stream().filter(InventoryAssignment::isIncluded).toList();
		var reviewedActivityIds = allAssignments.stream()
			.map(assignment -> assignment.getActivity().getId())
			.collect(java.util.stream.Collectors.toSet());
		var orgActivities = activities
			.findAllByFacilityOrganizationIdOrderByActivityDateDesc(inventory.getOrganization().getId());

		var boundaryFindings = new ArrayList<Finding>();
		if (boundary.isEmpty()) {
			boundaryFindings.add(new Finding(Severity.ERROR,
					"The organizational boundary is empty — add at least one facility."));
		}
		var approach = inventory.getConsolidationApproach();
		for (var treatment : boundary) {
			if (treatment.accountingShare(approach).signum() == 0) {
				boundaryFindings.add(new Finding(Severity.WARNING,
						treatment.getFacility().getName() + " has a 0% accounting share under "
								+ approach.name().toLowerCase().replace('_', ' ') + " — it contributes nothing."));
			}
		}
		for (var assignment : included) {
			var facilityId = assignment.getActivity().getFacility().getId();
			if (boundary.stream().noneMatch(treatment -> treatment.getFacility().getId().equals(facilityId))) {
				boundaryFindings.add(new Finding(Severity.ERROR,
						"Included activity '" + assignment.getActivity().getActivityType() + "' ("
								+ assignment.getActivity().getFacility().getName()
								+ ") is outside the boundary — exclude it or add the facility."));
			}
		}

		var completenessFindings = new ArrayList<Finding>();
		var unreviewed = orgActivities.stream()
			.filter(activity -> !reviewedActivityIds.contains(activity.getId()))
			.count();
		if (unreviewed > 0) {
			completenessFindings.add(new Finding(Severity.WARNING, unreviewed + " organizational activity record"
					+ (unreviewed == 1 ? " has" : "s have") + " not been reviewed — run \"Review activity data\"."));
		}
		for (var assignment : allAssignments) {
			if (assignment.isIncluded() || !isAutoReason(assignment.getExclusionReason())) {
				continue;
			}
			var inPeriod = inventory.covers(assignment.getActivity().getActivityDate());
			var inBoundaryNow = boundary.stream()
				.anyMatch(treatment -> treatment.getFacility()
					.getId()
					.equals(assignment.getActivity().getFacility().getId()));
			if (inPeriod && inBoundaryNow) {
				completenessFindings.add(new Finding(Severity.WARNING,
						"'" + assignment.getActivity().getActivityType() + "' ("
								+ assignment.getActivity().getActivityDate()
								+ ") is excluded for a reason that no longer holds — run \"Review activity data\"."));
			}
		}
		for (var assignment : included) {
			if (!inventory.covers(assignment.getActivity().getActivityDate())) {
				completenessFindings.add(new Finding(Severity.ERROR,
						"Included activity '" + assignment.getActivity().getActivityType() + "' is dated "
								+ assignment.getActivity().getActivityDate()
								+ ", outside the reporting period — exclude it."));
			}
			if (assignment.getActivity().getEvidenceRef() == null) {
				completenessFindings.add(new Finding(Severity.WARNING,
						"'" + assignment.getActivity().getActivityType() + "' ("
								+ assignment.getActivity().getActivityDate() + ") has no evidence reference."));
			}
			if (assignment.getActivity().getDataQuality() != DataQuality.MEASURED) {
				completenessFindings.add(new Finding(Severity.INFO,
						"'" + assignment.getActivity().getActivityType() + "' ("
								+ assignment.getActivity().getActivityDate() + ") is "
								+ assignment.getActivity().getDataQuality().name().toLowerCase() + " data."));
			}
		}

		var classificationFindings = new ArrayList<Finding>();
		for (var assignment : included) {
			if (!assignment.isClassified()) {
				classificationFindings.add(new Finding(Severity.ERROR,
						"'" + assignment.getActivity().getActivityType() + "' ("
								+ assignment.getActivity().getFacility().getName() + ", "
								+ assignment.getActivity().getActivityDate()
								+ ") is unclassified — assign an emission factor or exclude it."));
			}
		}

		var factorFindings = new ArrayList<Finding>();
		for (var assignment : included) {
			if (assignment.isClassified()
					&& !assignment.getEmissionFactor().getUnit().equalsIgnoreCase(assignment.getActivity().getUnit())) {
				factorFindings.add(new Finding(Severity.ERROR,
						"'" + assignment.getActivity().getActivityType() + "' is recorded in "
								+ assignment.getActivity().getUnit() + " but its factor '"
								+ assignment.getEmissionFactor().getName() + "' expects "
								+ assignment.getEmissionFactor().getUnit() + " — no conversion is configured."));
			}
		}

		return new Report(List.of(new GateResult(Gate.BOUNDARY, List.copyOf(boundaryFindings)),
				new GateResult(Gate.COMPLETENESS, List.copyOf(completenessFindings)),
				new GateResult(Gate.CLASSIFICATION, List.copyOf(classificationFindings)),
				new GateResult(Gate.EMISSION_FACTOR, List.copyOf(factorFindings))));
	}

	// --- calculation runs ----------------------------------------------------

	@Transactional(readOnly = true)
	public List<GhgRun> listRuns(UUID inventoryId) {
		get(inventoryId);
		return runs.findAllByInventoryIdOrderByCreatedAtDesc(inventoryId);
	}

	@Transactional(readOnly = true)
	public GhgRun getRun(UUID id) {
		var run = runs.findWithLinesById(id).orElseThrow(() -> GhgNotFoundException.run(id));
		access.check(run.getInventory().getOrganization());
		return run;
	}

	/**
	 * Validates the inventory view and, if no gate blocks, snapshots it into
	 * an immutable run: quantity x factor x accounting share per included
	 * assignment (spec 003, invariant 3).
	 */
	public GhgRun executeRun(UUID inventoryId, String label) {
		var inventory = get(inventoryId);
		var report = validate(inventoryId);
		if (!report.ready()) {
			var errorCount = report.gates()
				.stream()
				.flatMap(gate -> gate.findings().stream())
				.filter(finding -> finding.severity() == Severity.ERROR)
				.count();
			throw new ValidationBlockedException(errorCount);
		}
		var shares = new java.util.HashMap<UUID, BigDecimal>();
		for (var treatment : boundaryTreatments.findAllByInventoryId(inventoryId)) {
			shares.put(treatment.getFacility().getId(),
					treatment.accountingShare(inventory.getConsolidationApproach()));
		}
		var run = new GhgRun(inventory, label.trim());
		for (var assignment : assignments.findAllByInventoryIdOrderByCreatedAtAsc(inventoryId)) {
			if (!assignment.isIncluded()) {
				continue;
			}
			var share = shares.getOrDefault(assignment.getActivity().getFacility().getId(), BigDecimal.ZERO);
			var kgCo2e = assignment.getActivity()
				.getQuantity()
				.multiply(assignment.getEmissionFactor().getKgCo2ePerUnit())
				.multiply(share)
				.setScale(3, RoundingMode.HALF_UP);
			run.addLine(new GhgRunLine(run, assignment, share, kgCo2e));
		}
		run = runs.save(run);
		events.publishEvent(new GhgRunCompleted(run.getId(), inventoryId, run.getTotalKgCo2e()));
		return run;
	}

	/** Designates this run as the final/approved run of its inventory. */
	public Inventory finalizeRun(UUID runId) {
		var run = getRun(runId);
		var inventory = inventories.findById(run.getInventory().getId())
			.orElseThrow(() -> GhgNotFoundException.inventory(run.getInventory().getId()));
		inventory.setFinalRunId(runId);
		return inventory;
	}

	public void deleteRun(UUID id) {
		var run = getRun(id);
		var inventory = run.getInventory();
		if (id.equals(inventory.getFinalRunId())) {
			inventory.setFinalRunId(null);
		}
		runs.delete(run);
	}

	// --- helpers -------------------------------------------------------------

	private InventoryAssignment getAssignment(UUID id) {
		var assignment = assignments.findWithDetailsById(id)
			.orElseThrow(() -> GhgNotFoundException.assignment(id));
		access.check(assignment.getInventory().getOrganization());
		return assignment;
	}

	private void requireOrganization(UUID organizationId) {
		var organization = organizations.findById(organizationId)
			.orElseThrow(() -> GhgNotFoundException.organization(organizationId));
		access.check(organization);
	}

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
