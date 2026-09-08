package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Base year and recalculation policy (spec 06, Chapter 5). A boundary version
 * that adds or removes facilities, or changes a membership window, is a
 * candidate structural change; its weight is measured against the base-year
 * run and recorded for the accountant to decide. Organic growth never flags,
 * and neither does a facility that did not exist in the base year.
 */
@Service
@Transactional
public class BaseYearService {

	private final BaseYearRepository baseYears;
	private final OrganizationRepository organizations;
	private final InventoryRepository inventories;
	private final GhgRunRepository runs;
	private final BoundaryVersionRepository boundaryVersions;
	private final GhgAccess access;

	BaseYearService(BaseYearRepository baseYears, OrganizationRepository organizations,
			InventoryRepository inventories, GhgRunRepository runs, BoundaryVersionRepository boundaryVersions,
			GhgAccess access) {
		this.baseYears = baseYears;
		this.organizations = organizations;
		this.inventories = inventories;
		this.runs = runs;
		this.boundaryVersions = boundaryVersions;
		this.access = access;
	}

	@Transactional(readOnly = true)
	public Optional<BaseYear> find(UUID organizationId) {
		var organization = organizations.findById(organizationId)
			.orElseThrow(() -> GhgNotFoundException.organization(organizationId));
		access.check(organization);
		return baseYears.findByOrganizationId(organizationId);
	}

	/** Designates (or re-designates) the base year and records the policy. */
	public BaseYear set(UUID organizationId, UUID inventoryId, BigDecimal thresholdPercent, boolean triggerStructural,
			boolean triggerMethodology, boolean triggerErrors) {
		var organization = organizations.findById(organizationId)
			.orElseThrow(() -> GhgNotFoundException.organization(organizationId));
		access.check(organization);
		var inventory = inventories.findById(inventoryId).orElseThrow(() -> GhgNotFoundException.inventory(inventoryId));
		if (!inventory.getOrganization().getId().equals(organizationId)) {
			throw GhgNotFoundException.inventory(inventoryId);
		}
		return baseYears.findByOrganizationId(organizationId).map(existing -> {
			existing.update(inventory, thresholdPercent, triggerStructural, triggerMethodology, triggerErrors);
			return existing;
		}).orElseGet(() -> baseYears.save(new BaseYear(organization, inventory, thresholdPercent, triggerStructural,
				triggerMethodology, triggerErrors)));
	}

	public void clear(UUID organizationId) {
		find(organizationId).ifPresent(baseYears::delete);
	}

	/**
	 * Records the accountant's decision on a flag: a recalculated base (a run of
	 * the base-year inventory that now carries the reason) or a documented
	 * refusal. Either way the flag is resolved.
	 */
	public BaseYear decide(UUID organizationId, UUID recalculationId, RecalculationStatus decision, UUID runId,
			String note) {
		var baseYear = find(organizationId).orElseThrow(() -> GhgNotFoundException.baseYear(organizationId));
		var recalculation = baseYear.getRecalculations()
			.stream()
			.filter(candidate -> candidate.getId().equals(recalculationId))
			.findFirst()
			.orElseThrow(() -> GhgNotFoundException.recalculation(recalculationId));
		if (decision == RecalculationStatus.FLAGGED) {
			throw new GhgRuleViolationException("A decision is either RECALCULATED or DECLINED.");
		}
		if (decision == RecalculationStatus.RECALCULATED) {
			if (runId == null) {
				throw new GhgRuleViolationException(
						"A recalculated base year is a run of the base-year inventory. Name the run.");
			}
			var run = runs.findById(runId).orElseThrow(() -> GhgNotFoundException.run(runId));
			if (!run.getInventory().getId().equals(baseYear.getInventory().getId())) {
				throw new GhgRuleViolationException("The recalculated base must be a run of the base-year inventory '"
						+ baseYear.getInventory().getName() + "'.");
			}
		}
		recalculation.decide(decision, decision == RecalculationStatus.RECALCULATED ? runId : null, trimToNull(note),
				access.currentUserEmail());
		return baseYear;
	}

	/** Unresolved flags for the organization, for the BASE_YEAR validation gate. */
	@Transactional(readOnly = true)
	public List<BaseYearRecalculation> unresolvedFlags(UUID organizationId) {
		return baseYears.findByOrganizationId(organizationId)
			.map(baseYear -> baseYear.getRecalculations()
				.stream()
				.filter(candidate -> candidate.getStatus() == RecalculationStatus.FLAGGED)
				.toList())
			.orElse(List.of());
	}

	/**
	 * Called when a boundary version is cut. Compares it with the version
	 * before it (or, for a first freeze, the base-year inventory's boundary under
	 * the same approach), weighs the affected facilities by their base-year
	 * emissions, and flags a recalculation candidate when they emitted anything
	 * in the base year.
	 */
	void evaluateStructuralChange(Inventory inventory, BoundaryVersion version, Optional<BoundaryVersion> previous) {
		var maybeBaseYear = baseYears.findByOrganizationId(inventory.getOrganization().getId());
		if (maybeBaseYear.isEmpty()) {
			return;
		}
		var baseYear = maybeBaseYear.get();
		var baseInventory = baseYear.getInventory();
		if (!baseYear.isTriggerStructural() || baseInventory.getId().equals(inventory.getId())) {
			return;
		}
		var baseRunId = baseInventory.getFinalRunId() != null ? baseInventory.getFinalRunId()
				: runs.findAllByInventoryIdOrderByCreatedAtDesc(baseInventory.getId())
					.stream()
					.map(GhgRun::getId)
					.findFirst()
					.orElse(null);
		if (baseRunId == null) {
			return; // no base-year emissions to measure against yet
		}
		var baseline = previous.or(() -> baseInventory.getConsolidationApproach() == inventory
			.getConsolidationApproach() && baseInventory.getCurrentBoundaryVersionId() != null
					? boundaryVersions.findWithEntriesById(baseInventory.getCurrentBoundaryVersionId())
					: Optional.empty());
		if (baseline.isEmpty()) {
			return;
		}
		var changes = structuralChanges(baseline.get(), version);
		if (changes.isEmpty()) {
			return;
		}
		var baseRun = runs.findWithLinesById(baseRunId).orElseThrow(() -> GhgNotFoundException.run(baseRunId));
		var affectedKg = baseRun.getLines()
			.stream()
			.filter(line -> line.getFacilityId() != null && changes.containsKey(line.getFacilityId()))
			.map(GhgRunLine::getKgCo2e)
			.reduce(BigDecimal.ZERO, BigDecimal::add);
		if (affectedKg.signum() == 0 || baseRun.getTotalKgCo2e().signum() == 0) {
			return; // facilities that did not exist in the base year are organic growth, not a structural change
		}
		var percent = affectedKg.multiply(new BigDecimal("100"))
			.divide(baseRun.getTotalKgCo2e(), 2, RoundingMode.HALF_UP);
		var above = percent.compareTo(baseYear.getThresholdPercent()) > 0;
		var threshold = baseYear.getThresholdPercent().stripTrailingZeros().toPlainString();
		var reason = "structural change: " + String.join(", ", changes.values()) + "; " + percent.stripTrailingZeros()
			.toPlainString() + "% of base-year emissions, " + (above ? "above" : "below") + " the " + threshold
				+ "% threshold, recalculation " + (above ? "required" : "optional");
		baseYear.flag(RecalculationTrigger.STRUCTURAL_CHANGE, reason, inventory, version, percent);
	}

	/** Facility id to a description of what changed between two versions. */
	private static Map<UUID, String> structuralChanges(BoundaryVersion before, BoundaryVersion after) {
		var changes = new HashMap<UUID, String>();
		var beforeIds = new ArrayList<>(before.memberFacilityIds());
		var afterIds = new ArrayList<>(after.memberFacilityIds());
		for (var id : afterIds) {
			var entry = after.entryHolding(id).orElseThrow();
			var name = facilityName(entry, id);
			if (!beforeIds.contains(id)) {
				changes.put(id, name + " added");
			}
			else {
				var earlier = before.entryHolding(id).orElseThrow();
				var windowChanged = !java.util.Objects.equals(earlier.getEffectiveFrom(), entry.getEffectiveFrom())
						|| !java.util.Objects.equals(earlier.getEffectiveTo(), entry.getEffectiveTo());
				if (windowChanged) {
					changes.put(id, name + " membership window changed");
				}
			}
		}
		for (var id : beforeIds) {
			if (!afterIds.contains(id)) {
				changes.put(id, facilityName(before.entryHolding(id).orElseThrow(), id) + " removed");
			}
		}
		return changes;
	}

	private static String facilityName(BoundaryVersionEntry entry, UUID facilityId) {
		return entry.getFacilities()
			.stream()
			.filter(facility -> facility.getFacilityId().equals(facilityId))
			.map(BoundaryVersionFacility::getFacilityName)
			.findFirst()
			.orElse(facilityId.toString());
	}

	private static String trimToNull(String value) {
		if (value == null || value.trim().isEmpty()) {
			return null;
		}
		return value.trim();
	}
}
