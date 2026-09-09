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
 * Base year and recalculation policy (spec 06, 06.1, Chapter 5). A boundary
 * version that adds or removes facilities, or changes a membership window, is
 * a candidate structural change; its weight is measured against the base-year
 * run, on its own and together with the outstanding earlier changes, and
 * recorded for the accountant to decide. Methodology changes and error
 * corrections are raised by the accountant. Organic growth never flags, and
 * neither does a facility that did not exist in the base year.
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

	/** The organization's base year without a tenant check, for gates and reports that already passed one. */
	@Transactional(readOnly = true)
	Optional<BaseYear> of(UUID organizationId) {
		return baseYears.findByOrganizationId(organizationId);
	}

	/** Designates (or re-designates) the base year and records the policy. */
	public BaseYear set(UUID organizationId, UUID inventoryId, BigDecimal thresholdPercent, String reason,
			StructuralChangeConvention convention) {
		access.checkWrite(organizations.findById(organizationId).orElseThrow(() -> GhgNotFoundException.organization(organizationId)));
		var organization = organizations.findById(organizationId)
			.orElseThrow(() -> GhgNotFoundException.organization(organizationId));
		access.check(organization);
		var inventory = inventories.findById(inventoryId).orElseThrow(() -> GhgNotFoundException.inventory(inventoryId));
		if (!inventory.getOrganization().getId().equals(organizationId)) {
			throw GhgNotFoundException.inventory(inventoryId);
		}
		var trimmedReason = reason.trim();
		var effectiveConvention = convention == null ? StructuralChangeConvention.TRANSACTION_DATE : convention;
		return baseYears.findByOrganizationId(organizationId).map(existing -> {
			existing.update(inventory, thresholdPercent, trimmedReason, effectiveConvention);
			return existing;
		}).orElseGet(() -> baseYears
			.save(new BaseYear(organization, inventory, thresholdPercent, trimmedReason, effectiveConvention)));
	}

	/**
	 * The accountant raises a methodology-change or error-correction candidate
	 * (spec 06.1): the Standard makes both mandatory triggers, and neither can
	 * be detected from the data. Structural changes are detected at freeze.
	 */
	public BaseYear raise(UUID organizationId, RecalculationTrigger trigger, String reason,
			BigDecimal affectedPercent) {
		access.checkWrite(organizations.findById(organizationId).orElseThrow(() -> GhgNotFoundException.organization(organizationId)));
		var baseYear = find(organizationId).orElseThrow(() -> GhgNotFoundException.baseYear(organizationId));
		if (trigger == RecalculationTrigger.STRUCTURAL_CHANGE) {
			throw new GhgRuleViolationException(
					"Structural changes are detected when an inventory is frozen. Freeze the inventory instead.");
		}
		var what = (trigger == RecalculationTrigger.METHODOLOGY_CHANGE ? "methodology change: "
				: "error correction: ") + reason.trim();
		baseYear.flag(trigger, what, null, null, affectedPercent.setScale(2, RoundingMode.HALF_UP),
				access.currentUserEmail());
		return baseYear;
	}

	public void clear(UUID organizationId) {
		access.checkWrite(organizations.findById(organizationId).orElseThrow(() -> GhgNotFoundException.organization(organizationId)));
		find(organizationId).ifPresent(baseYears::delete);
	}

	/**
	 * Records the accountant's decision on a flag: a recalculated base (a run of
	 * the base-year inventory that now carries the reason) or a documented
	 * refusal. Either way the flag is resolved.
	 */
	public BaseYear decide(UUID organizationId, UUID recalculationId, RecalculationStatus decision, UUID runId,
			String note) {
		access.checkWrite(organizations.findById(organizationId).orElseThrow(() -> GhgNotFoundException.organization(organizationId)));
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
			if (run.isVoided()) {
				throw new GhgRuleViolationException("Run " + run.getRunNo() + " is voided and cannot be the recalculated base.");
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
		if (baseInventory.getId().equals(inventory.getId())) {
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
		baseYear.flag(RecalculationTrigger.STRUCTURAL_CHANGE, "structural change: " + String.join(", ", changes.values()),
				inventory, version, percent, null);
	}

	/**
	 * Recalculated base runs whose boundary version carries a membership
	 * window: under the whole-year convention they contradict the policy (spec
	 * 06.1). Empty under the transaction-date convention.
	 */
	@Transactional(readOnly = true)
	List<String> recalculatedBasesWithWindows(BaseYear baseYear) {
		if (baseYear.getStructuralChangeConvention() != StructuralChangeConvention.WHOLE_YEAR) {
			return List.of();
		}
		return baseYear.getRecalculations()
			.stream()
			.filter(candidate -> candidate.getStatus() == RecalculationStatus.RECALCULATED
					&& candidate.getRunId() != null)
			.map(candidate -> runs.findById(candidate.getRunId()).orElse(null))
			.filter(run -> run != null && run.getBoundaryVersionId() != null)
			.filter(run -> boundaryVersions.findWithEntriesById(run.getBoundaryVersionId())
				.map(version -> version.getEntries()
					.stream()
					.anyMatch(entry -> entry.getEffectiveFrom() != null || entry.getEffectiveTo() != null))
				.orElse(false))
			.map(GhgRun::getLabel)
			.toList();
	}

	/** One inventory in the emissions profile over time (spec 06.1, Chapter 9). */
	public record ProfileEntry(Inventory inventory, GhgRun finalRun, GhgRun recalculatedRun) {
	}

	/**
	 * Every inventory of the organization whose period lies between the base
	 * year and the reporting period, with its final run and, for the base-year
	 * inventory, the latest recalculated base (spec 06.1).
	 */
	@Transactional(readOnly = true)
	public List<ProfileEntry> profile(BaseYear baseYear, java.time.LocalDate reportingPeriodEnd) {
		var baseInventory = baseYear.getInventory();
		var recalculated = baseYear.getRecalculations()
			.stream()
			.filter(candidate -> candidate.getStatus() == RecalculationStatus.RECALCULATED
					&& candidate.getRunId() != null)
			.reduce((first, second) -> second)
			.flatMap(candidate -> runs.findById(candidate.getRunId()))
			.orElse(null);
		return inventories.findAllByOrganizationIdOrderByCreatedAtDesc(baseYear.getOrganization().getId())
			.stream()
			.filter(inventory -> !inventory.getPeriodStart().isBefore(baseInventory.getPeriodStart())
					&& !inventory.getPeriodEnd().isAfter(reportingPeriodEnd))
			.sorted(java.util.Comparator.comparing(Inventory::getPeriodStart).thenComparing(Inventory::getCreatedAt))
			.map(inventory -> new ProfileEntry(inventory,
					inventory.getFinalRunId() == null ? null : runs.findById(inventory.getFinalRunId()).orElse(null),
					inventory.getId().equals(baseInventory.getId()) ? recalculated : null))
			.toList();
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
