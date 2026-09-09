package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.util.Locale;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carbonos.ghg.GhgRunCompleted;
import com.carbonos.ghg.InventoryPublished;
import com.carbonos.ghg.internal.Validation.Finding;
import com.carbonos.ghg.internal.Validation.Gate;
import com.carbonos.ghg.internal.Validation.GateResult;
import com.carbonos.ghg.internal.Validation.Report;
import com.carbonos.ghg.internal.Validation.Severity;

/**
 * The accounting-view side of spec 05: inventories and their lifecycle (spec
 * 05.1), boundaries by legal entity (spec 03.1) with membership windows (spec
 * 03.2), activity assignments classified by the accountant (spec 04.1), the
 * pre-run validation gates, and calculation runs with per-gas and
 * market-based figures (spec 07.1). Nothing here ever mutates an
 * {@link ActivityRecord} (invariant 2).
 */
@Service
@Transactional
public class InventoryService {

	private static final String KWH = "kWh";

	private final OrganizationRepository organizations;
	private final LegalEntityRepository entities;
	private final FacilityRepository facilities;
	private final ActivityRecordRepository activities;
	private final EmissionFactorRepository emissionFactors;
	private final InventoryRepository inventories;
	private final BoundaryTreatmentRepository boundaryTreatments;
	private final BoundaryVersionRepository boundaryVersions;
	private final BoundaryExclusionRepository boundaryExclusions;
	private final InventoryAssignmentRepository assignments;
	private final MarketFactorRepository marketFactors;
	private final GhgRunRepository runs;
	private final GhgAuditEventRepository auditEvents;
	private final IntensityMetricRepository intensityMetrics;
	private final BaseYearService baseYears;
	private final ApplicationEventPublisher events;
	private final GhgAccess access;
	private final OrganizationUnits organizationUnits;
	private final DensityRepository densities;
	private final EvidenceRepository evidence;
	private final SourceStreamRepository streams;

	InventoryService(OrganizationRepository organizations, LegalEntityRepository entities,
			FacilityRepository facilities, ActivityRecordRepository activities,
			EmissionFactorRepository emissionFactors, InventoryRepository inventories,
			BoundaryTreatmentRepository boundaryTreatments, BoundaryVersionRepository boundaryVersions,
			BoundaryExclusionRepository boundaryExclusions, InventoryAssignmentRepository assignments,
			MarketFactorRepository marketFactors, GhgRunRepository runs, GhgAuditEventRepository auditEvents,
			IntensityMetricRepository intensityMetrics, BaseYearService baseYears, ApplicationEventPublisher events,
			GhgAccess access, OrganizationUnits organizationUnits, DensityRepository densities,
			EvidenceRepository evidence, SourceStreamRepository streams) {
		this.streams = streams;
		this.organizationUnits = organizationUnits;
		this.densities = densities;
		this.evidence = evidence;
		this.organizations = organizations;
		this.entities = entities;
		this.facilities = facilities;
		this.activities = activities;
		this.emissionFactors = emissionFactors;
		this.inventories = inventories;
		this.boundaryTreatments = boundaryTreatments;
		this.boundaryVersions = boundaryVersions;
		this.boundaryExclusions = boundaryExclusions;
		this.assignments = assignments;
		this.marketFactors = marketFactors;
		this.runs = runs;
		this.auditEvents = auditEvents;
		this.intensityMetrics = intensityMetrics;
		this.baseYears = baseYears;
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
			String purpose, Integer baseYear, ConsolidationApproach approach, GwpSet gwpSet,
			StraddleTreatment straddleTreatment) {
		return create(organizationId, name, periodStart, periodEnd, purpose, baseYear, approach, gwpSet,
				straddleTreatment, false);
	}

	/**
	 * With {@code prefillBoundary} (spec 03.4): every entity whose share under
	 * the approach is above zero joins the boundary with all its facilities,
	 * its window defaulted from its dates. Under a control approach every
	 * controlled operation is in by definition; leaving one out is then a
	 * deliberate exclusion with a reason.
	 */
	public Inventory create(UUID organizationId, String name, LocalDate periodStart, LocalDate periodEnd,
			String purpose, Integer baseYear, ConsolidationApproach approach, GwpSet gwpSet,
			StraddleTreatment straddleTreatment, boolean prefillBoundary) {
		return create(organizationId, name, periodStart, periodEnd, purpose, baseYear, approach, gwpSet,
				straddleTreatment, prefillBoundary, null);
	}

	/**
	 * With {@code copyFromInventoryId} (spec 05.3): the boundary, exclusions,
	 * instruments, declaration and every assignment of another inventory of the
	 * organization are copied, so a second inventory over the same period, or
	 * the next year's, starts from last year's decisions.
	 */
	public Inventory create(UUID organizationId, String name, LocalDate periodStart, LocalDate periodEnd,
			String purpose, Integer baseYear, ConsolidationApproach approach, GwpSet gwpSet,
			StraddleTreatment straddleTreatment, boolean prefillBoundary, UUID copyFromInventoryId) {
		requirePeriod(periodStart, periodEnd);
		var organization = organizations.findById(organizationId)
			.orElseThrow(() -> GhgNotFoundException.organization(organizationId));
		access.checkWrite(organization);
		var inventory = inventories.save(new Inventory(organization, name.trim(), periodStart, periodEnd,
				trimToNull(purpose), baseYear, approach, gwpSet == null ? GwpSet.AR5 : gwpSet,
				straddleTreatment == null ? StraddleTreatment.PRO_RATE : straddleTreatment));
		if (copyFromInventoryId != null) {
			var source = get(copyFromInventoryId);
			if (!source.getOrganization().getId().equals(organizationId)) {
				throw GhgNotFoundException.inventory(copyFromInventoryId);
			}
			copyView(source, inventory, true);
			inventory.setCopiedFromId(source.getId());
			return inventory;
		}
		if (prefillBoundary) {
			var facilitiesByEntity = facilities
				.findAllByOrganizationIdAndDeletedAtIsNullOrderByCreatedAtAsc(organizationId)
				.stream()
				.collect(Collectors.groupingBy(facility -> facility.getEntity().getId()));
			for (var entity : entities
				.findAllByOrganizationIdAndDeletedAtIsNullOrderByReportingCompanyDescCreatedAtAsc(organizationId)) {
				var members = facilitiesByEntity.getOrDefault(entity.getId(), List.of());
				if (members.isEmpty() || entity.share(approach).signum() == 0) {
					continue;
				}
				var treatment = new BoundaryTreatment(inventory, entity);
				members.forEach(treatment::includeFacility);
				boundaryTreatments.save(treatment);
			}
		}
		return inventory;
	}

	public Inventory update(UUID id, String name, LocalDate periodStart, LocalDate periodEnd, String purpose,
			Integer baseYear, ConsolidationApproach approach, GwpSet gwpSet, StraddleTreatment straddleTreatment) {
		requirePeriod(periodStart, periodEnd);
		var inventory = get(id);
		access.checkWrite(inventory.getOrganization());
		var effectiveGwp = gwpSet == null ? inventory.getGwpSet() : gwpSet;
		if (inventory.getStatus() == InventoryStatus.PUBLISHED) {
			throw new GhgRuleViolationException(
					"A published inventory cannot change. Create a correction that supersedes it.");
		}
		if (!inventory.isEditable()) {
			// the frozen version's shares derive from the approach and the run from the rest (spec 03, 05.1)
			var changed = approach != inventory.getConsolidationApproach()
					|| !periodStart.equals(inventory.getPeriodStart()) || !periodEnd.equals(inventory.getPeriodEnd())
					|| effectiveGwp != inventory.getGwpSet();
			if (changed) {
				throw new GhgRuleViolationException("The period, consolidation approach and GWP set cannot change "
						+ "while the inventory is frozen. Reopen it as a draft first.");
			}
		}
		inventory.update(name.trim(), periodStart, periodEnd, trimToNull(purpose), baseYear, approach, effectiveGwp);
		if (straddleTreatment != null) {
			inventory.setStraddleTreatment(straddleTreatment);
		}
		return inventory;
	}

	public void delete(UUID id) {
		var inventory = get(id);
		access.checkWrite(inventory.getOrganization());
		if (inventory.getStatus() == InventoryStatus.PUBLISHED) {
			throw new GhgRuleViolationException("A published inventory is a record and cannot be deleted.");
		}
		inventories.delete(inventory);
	}

	/** The operational boundary declaration (spec 07.1): which scope 3 categories are covered and why others are not. */
	public Inventory setOperationalBoundary(UUID id, List<ActivityCategory> scope3Categories,
			String exclusionsRationale) {
		var inventory = get(id);
		requireEditable(inventory);
		for (var category : scope3Categories) {
			if (category.scope() != Scope.SCOPE_3) {
				throw new GhgRuleViolationException(category + " is not a scope 3 category.");
			}
		}
		inventory.setOperationalBoundary(scope3Categories, trimToNull(exclusionsRationale));
		return inventory;
	}

	// --- organizational boundary (spec 03.1, 03.2) ---------------------------

	@Transactional(readOnly = true)
	public List<BoundaryTreatment> boundary(UUID inventoryId) {
		get(inventoryId);
		return boundaryTreatments.findAllByInventoryId(inventoryId);
	}

	/** Explicit overrides for an entity's treatment; a null field prefills from the entity on creation and keeps its value on update. */
	public record TreatmentInput(RelationshipType relationshipType, BigDecimal economicInterestPercent,
			Boolean operatedByCompany, Boolean controlledByCompany, LocalDate effectiveFrom, LocalDate effectiveTo,
			boolean clearWindow, Boolean financialControlOverride, boolean clearFinancialControlOverride) {
		static TreatmentInput none() {
			return new TreatmentInput(null, null, null, null, null, null, false, null, false);
		}
	}

	/**
	 * One entity as the boundary sees it, with the chain resolved inside the
	 * transaction (spec 03.3) and any exclusion recorded for it or for its
	 * facilities (spec 07.2).
	 */
	public record BoundaryEntityView(LegalEntity entity, List<Facility> facilities, BoundaryTreatment treatment,
			EntityChain chain, BoundaryExclusion entityExclusion, Map<UUID, BoundaryExclusion> facilityExclusions) {
	}

	/**
	 * Every entity of the organization with its facilities, its treatment in
	 * this inventory if any, and the chain of parents resolved: a parent's
	 * treatment where the parent is in the boundary, else the parent's facts.
	 */
	@Transactional(readOnly = true)
	public List<BoundaryEntityView> boundaryView(UUID inventoryId) {
		var inventory = get(inventoryId);
		var organizationId = inventory.getOrganization().getId();
		var treatments = boundaryTreatments.findAllByInventoryId(inventoryId)
			.stream()
			.collect(Collectors.toMap(treatment -> treatment.getEntity().getId(), Function.identity()));
		var facilitiesByEntity = facilities.findAllByOrganizationIdAndDeletedAtIsNullOrderByCreatedAtAsc(organizationId)
			.stream()
			.collect(Collectors.groupingBy(facility -> facility.getEntity().getId()));
		var exclusions = boundaryExclusions.findAllByInventoryIdOrderByCreatedAtAsc(inventoryId);
		var byEntity = exclusions.stream()
			.filter(BoundaryExclusion::isWholeEntity)
			.collect(Collectors.toMap(exclusion -> exclusion.getEntity().getId(), Function.identity()));
		var byFacility = exclusions.stream()
			.filter(exclusion -> !exclusion.isWholeEntity())
			.collect(Collectors.toMap(exclusion -> exclusion.getFacility().getId(), Function.identity()));
		return entities.findAllByOrganizationIdAndDeletedAtIsNullOrderByReportingCompanyDescCreatedAtAsc(organizationId)
			.stream()
			.map(entity -> new BoundaryEntityView(entity,
					facilitiesByEntity.getOrDefault(entity.getId(), List.of()), treatments.get(entity.getId()),
					chainOf(entity, inventory.getConsolidationApproach(), treatments), byEntity.get(entity.getId()),
					byFacility))
			.toList();
	}

	// --- boundary exclusions (spec 07.2) ---------------------------------------------

	@Transactional(readOnly = true)
	public List<BoundaryExclusion> boundaryExclusions(UUID inventoryId) {
		get(inventoryId);
		return boundaryExclusions.findAllByInventoryIdOrderByCreatedAtAsc(inventoryId);
	}

	/** Records why a whole entity is left out of the boundary. Refused while the entity is in it. */
	public BoundaryExclusion excludeEntity(UUID inventoryId, UUID entityId, ExclusionReason reason, String detail) {
		var inventory = get(inventoryId);
		requireEditable(inventory);
		var entity = requireEntity(entityId, inventory);
		if (boundaryTreatments.findByInventoryIdAndEntityId(inventoryId, entityId).isPresent()) {
			throw new GhgRuleViolationException("'" + entity.getName()
					+ "' is in the boundary. Remove it from the boundary before excluding it.");
		}
		return boundaryExclusions.findByInventoryIdAndEntityId(inventoryId, entityId).map(existing -> {
			existing.update(reason, trimToNull(detail));
			return existing;
		}).orElseGet(() -> boundaryExclusions
			.save(new BoundaryExclusion(inventory, entity, null, reason, trimToNull(detail))));
	}

	/** Records why one facility of a member entity is left out. Refused while the facility is in the boundary. */
	public BoundaryExclusion excludeFacility(UUID inventoryId, UUID facilityId, ExclusionReason reason,
			String detail) {
		var inventory = get(inventoryId);
		requireEditable(inventory);
		var facility = requireFacility(facilityId, inventory);
		var inBoundary = boundaryTreatments.findAllByInventoryId(inventoryId)
			.stream()
			.anyMatch(treatment -> treatment.includes(facilityId));
		if (inBoundary) {
			throw new GhgRuleViolationException("'" + facility.getName()
					+ "' is in the boundary. Remove it from the boundary before excluding it.");
		}
		return boundaryExclusions.findByInventoryIdAndFacilityId(inventoryId, facilityId).map(existing -> {
			existing.update(reason, trimToNull(detail));
			return existing;
		}).orElseGet(() -> boundaryExclusions
			.save(new BoundaryExclusion(inventory, null, facility, reason, trimToNull(detail))));
	}

	public void clearEntityExclusion(UUID inventoryId, UUID entityId) {
		requireEditable(get(inventoryId));
		boundaryExclusions.delete(boundaryExclusions.findByInventoryIdAndEntityId(inventoryId, entityId)
			.orElseThrow(() -> GhgNotFoundException.entity(entityId)));
	}

	public void clearFacilityExclusion(UUID inventoryId, UUID facilityId) {
		requireEditable(get(inventoryId));
		boundaryExclusions.delete(boundaryExclusions.findByInventoryIdAndFacilityId(inventoryId, facilityId)
			.orElseThrow(() -> GhgNotFoundException.facility(facilityId)));
	}

	/** Ticking an operation in retires the exclusion that covered it: it is no longer left out. */
	private void retireExclusionsCovering(UUID inventoryId, LegalEntity entity, Facility facility) {
		boundaryExclusions.findByInventoryIdAndEntityId(inventoryId, entity.getId()).ifPresent(boundaryExclusions::delete);
		if (facility != null) {
			boundaryExclusions.findByInventoryIdAndFacilityId(inventoryId, facility.getId())
				.ifPresent(boundaryExclusions::delete);
		}
	}

	/**
	 * Facilities of the organization neither in the boundary nor covered by an
	 * exclusion: the undocumented omissions Chapter 9 does not allow.
	 */
	private List<Facility> undocumentedOmissions(UUID inventoryId, UUID organizationId,
			List<BoundaryTreatment> treatments) {
		var exclusions = boundaryExclusions.findAllByInventoryIdOrderByCreatedAtAsc(inventoryId);
		var excludedEntities = exclusions.stream()
			.filter(BoundaryExclusion::isWholeEntity)
			.map(exclusion -> exclusion.getEntity().getId())
			.collect(Collectors.toSet());
		var excludedFacilities = exclusions.stream()
			.filter(exclusion -> !exclusion.isWholeEntity())
			.map(exclusion -> exclusion.getFacility().getId())
			.collect(Collectors.toSet());
		return facilities.findAllByOrganizationIdAndDeletedAtIsNullOrderByCreatedAtAsc(organizationId)
			.stream()
			.filter(facility -> treatments.stream().noneMatch(treatment -> treatment.includes(facility.getId())))
			.filter(facility -> !excludedEntities.contains(facility.getEntity().getId())
					&& !excludedFacilities.contains(facility.getId()))
			.toList();
	}

	/** The parents' contribution to an entity's share: each parent's treatment in this inventory when present, else its facts. */
	static EntityChain chainOf(LegalEntity entity, ConsolidationApproach approach,
			Map<UUID, BoundaryTreatment> treatments) {
		var shareFactor = BigDecimal.ONE;
		var interestFactor = BigDecimal.ONE;
		var names = new ArrayList<String>();
		for (var ancestor = entity.getParent(); ancestor != null; ancestor = ancestor.getParent()) {
			var treatment = treatments.get(ancestor.getId());
			shareFactor = shareFactor
				.multiply(treatment != null ? treatment.ownShare(approach) : ancestor.ownShare(approach));
			interestFactor = interestFactor.multiply((treatment != null ? treatment.getEconomicInterestPercent()
					: ancestor.getEconomicInterestPercent()).movePointLeft(2));
			names.add(ancestor.getName());
		}
		return names.isEmpty() ? EntityChain.DIRECT : new EntityChain(shareFactor, interestFactor, List.copyOf(names));
	}

	private static Map<UUID, BoundaryTreatment> byEntity(List<BoundaryTreatment> treatments) {
		return treatments.stream().collect(Collectors.toMap(t -> t.getEntity().getId(), Function.identity()));
	}

	/** The share a treatment derives in this inventory, chain included. */
	private static BigDecimal shareOf(BoundaryTreatment treatment, ConsolidationApproach approach,
			Map<UUID, BoundaryTreatment> treatments) {
		return treatment.accountingShare(approach, chainOf(treatment.getEntity(), approach, treatments).shareFactor());
	}

	/**
	 * Adds the entity to the boundary with all its facilities, or updates its
	 * treatment if present. Draft inventories only (spec 05.1).
	 */
	public BoundaryTreatment setEntityTreatment(UUID inventoryId, UUID entityId, TreatmentInput input) {
		var inventory = get(inventoryId);
		requireEditable(inventory);
		var entity = requireEntity(entityId, inventory);
		var treatment = boundaryTreatments.findByInventoryIdAndEntityId(inventoryId, entityId).orElseGet(() -> {
			var created = new BoundaryTreatment(inventory, entity);
			facilities.findAllByOrganizationIdAndDeletedAtIsNullOrderByCreatedAtAsc(inventory.getOrganization().getId())
				.stream()
				.filter(facility -> facility.getEntity().getId().equals(entityId))
				.forEach(facility -> {
					created.includeFacility(facility);
					retireExclusionsCovering(inventoryId, entity, facility);
				});
			return boundaryTreatments.save(created);
		});
		retireExclusionsCovering(inventoryId, entity, null);
		apply(treatment, input);
		return treatment;
	}

	public void removeEntityTreatment(UUID inventoryId, UUID entityId) {
		requireEditable(get(inventoryId));
		var treatment = boundaryTreatments.findByInventoryIdAndEntityId(inventoryId, entityId)
			.orElseThrow(() -> GhgNotFoundException.entity(entityId));
		boundaryTreatments.delete(treatment);
	}

	/**
	 * Includes one facility: its entity joins the boundary, prefilled from the
	 * entity's facts, if it is not there yet. Overrides apply to the entity's
	 * treatment, which every facility of the entity shares (spec 03.1).
	 */
	public BoundaryTreatment includeFacility(UUID inventoryId, UUID facilityId, TreatmentInput input) {
		var inventory = get(inventoryId);
		requireEditable(inventory);
		var facility = requireFacility(facilityId, inventory);
		var entityId = facility.getEntity().getId();
		var treatment = boundaryTreatments.findByInventoryIdAndEntityId(inventoryId, entityId)
			.orElseGet(() -> boundaryTreatments.save(new BoundaryTreatment(inventory, facility.getEntity())));
		treatment.includeFacility(facility);
		retireExclusionsCovering(inventoryId, facility.getEntity(), facility);
		apply(treatment, input);
		return treatment;
	}

	/** Removes one facility; when it was the entity's last, the entity leaves the boundary too. */
	public void removeFacility(UUID inventoryId, UUID facilityId) {
		var inventory = get(inventoryId);
		requireEditable(inventory);
		var treatment = boundaryTreatments.findAllByInventoryId(inventoryId)
			.stream()
			.filter(candidate -> candidate.includes(facilityId))
			.findFirst()
			.orElseThrow(() -> GhgNotFoundException.facility(facilityId));
		treatment.removeFacility(facilityId);
		if (treatment.getFacilities().isEmpty()) {
			boundaryTreatments.delete(treatment);
		}
	}

	private static void apply(BoundaryTreatment treatment, TreatmentInput input) {
		var from = input.clearWindow() ? null
				: input.effectiveFrom() != null ? input.effectiveFrom() : treatment.getEffectiveFrom();
		var to = input.clearWindow() ? null : input.effectiveTo() != null ? input.effectiveTo() : treatment.getEffectiveTo();
		if (from != null && to != null && to.isBefore(from)) {
			throw new GhgRuleViolationException("The membership window ends before it starts.");
		}
		treatment.update(
				input.relationshipType() != null ? input.relationshipType() : treatment.getRelationshipType(),
				input.economicInterestPercent() != null ? input.economicInterestPercent()
						: treatment.getEconomicInterestPercent(),
				input.operatedByCompany() != null ? input.operatedByCompany() : treatment.isOperatedByCompany(),
				input.controlledByCompany() != null ? input.controlledByCompany() : treatment.isControlledByCompany(),
				from, to);
		if (input.clearFinancialControlOverride()) {
			treatment.setFinancialControlOverride(null);
		}
		else if (input.financialControlOverride() != null) {
			treatment.setFinancialControlOverride(input.financialControlOverride());
		}
	}

	// --- inventory lifecycle (spec 05.1) --------------------------------------

	/**
	 * Freezes the inventory: cuts an immutable, numbered boundary version from
	 * the current treatments and makes both the boundary and the activity view
	 * read-only. Every freeze cuts a new version, even an unchanged one, so the
	 * history is one row per deliberate act. A structural change against the
	 * base year is measured here (spec 06).
	 */
	public BoundaryVersion freeze(UUID inventoryId) {
		var inventory = get(inventoryId);
		access.checkWrite(inventory.getOrganization());
		if (!inventory.isEditable()) {
			throw new GhgRuleViolationException("The inventory is already frozen.");
		}
		var treatments = boundaryTreatments.findAllByInventoryId(inventoryId);
		if (treatments.isEmpty()) {
			throw new GhgRuleViolationException(
					"The organizational boundary is empty. Add at least one facility before freezing it.");
		}
		var previous = boundaryVersions.findTopByInventoryIdOrderByVersionNoDesc(inventoryId)
			.flatMap(latest -> boundaryVersions.findWithEntriesById(latest.getId()));
		var nextNo = previous.map(latest -> latest.getVersionNo() + 1).orElse(1);
		var byEntity = byEntity(treatments);
		var version = boundaryVersions.save(new BoundaryVersion(inventory, nextNo, treatments,
				treatment -> chainOf(treatment.getEntity(), inventory.getConsolidationApproach(), byEntity),
				boundaryExclusions.findAllByInventoryIdOrderByCreatedAtAsc(inventoryId), access.currentUserId(),
				access.currentUserEmail()));
		inventory.freeze(version);
		baseYears.evaluateStructuralChange(inventory, version, previous);
		record(inventory, null, GhgAuditEvent.Action.FROZEN, "boundary version " + version.getVersionNo() + " cut");
		return version;
	}

	/** Reopens a frozen inventory for editing. Versions already cut are untouched. */
	public Inventory reopen(UUID inventoryId) {
		var inventory = get(inventoryId);
		access.checkWrite(inventory.getOrganization());
		switch (inventory.getStatus()) {
			case DRAFT -> throw new GhgRuleViolationException("The inventory is already a draft.");
			case FINAL -> throw new GhgRuleViolationException(
					"A run is designated final. Withdraw the designation before reopening the inventory.");
			case PUBLISHED -> throw new GhgRuleViolationException(
					"A published inventory cannot change. Create a correction that supersedes it.");
			case FROZEN -> {
				inventory.reopen();
				record(inventory, null, GhgAuditEvent.Action.REOPENED, "reopened as a draft");
			}
		}
		return inventory;
	}

	/** Designates a run as the final one of its inventory, which moves the inventory to FINAL. */
	public Inventory designateFinal(UUID inventoryId, UUID runId) {
		var inventory = get(inventoryId);
		access.checkApprove(inventory.getOrganization());
		if (inventory.getStatus() == InventoryStatus.PUBLISHED) {
			throw new GhgRuleViolationException("A published inventory's final run cannot change.");
		}
		if (inventory.isEditable()) {
			throw new GhgRuleViolationException("Freeze the inventory before designating a final run.");
		}
		var run = runs.findById(runId).orElseThrow(() -> GhgNotFoundException.run(runId));
		if (!run.getInventory().getId().equals(inventoryId)) {
			throw GhgNotFoundException.run(runId);
		}
		if (run.isVoided()) {
			throw new GhgRuleViolationException("Run " + run.getRunNo() + " is voided and cannot be designated final.");
		}
		inventory.designateFinal(runId);
		record(inventory, run, GhgAuditEvent.Action.FINAL_DESIGNATED, "run " + run.getRunNo() + " designated final");
		return inventory;
	}

	/** Withdraws the final designation; the reason is recorded as an audit event (spec 05.2). */
	public Inventory withdrawFinal(UUID inventoryId, String reason) {
		var inventory = get(inventoryId);
		access.checkApprove(inventory.getOrganization());
		if (inventory.getStatus() != InventoryStatus.FINAL) {
			throw new GhgRuleViolationException("No run is designated final.");
		}
		var run = runs.findById(inventory.getFinalRunId()).orElse(null);
		inventory.withdrawFinal();
		auditEvents.save(new GhgAuditEvent(inventoryId, run, GhgAuditEvent.Action.FINAL_WITHDRAWN,
				access.currentUserId(), access.currentUserEmail(), reason.trim()));
		return inventory;
	}

	/** The recorded acts on an inventory, newest first (spec 05.2). */
	@Transactional(readOnly = true)
	public List<GhgAuditEvent> events(UUID inventoryId) {
		get(inventoryId);
		return auditEvents.findAllByInventoryIdOrderByCreatedAtDesc(inventoryId);
	}

	/** Issues the report: the inventory becomes a record and nothing on it may change afterwards. */
	public Inventory publish(UUID inventoryId) {
		var inventory = get(inventoryId);
		access.checkApprove(inventory.getOrganization());
		if (inventory.getStatus() != InventoryStatus.FINAL) {
			throw new GhgRuleViolationException("Designate a final run before publishing the inventory.");
		}
		inventory.publish(access.currentUserEmail());
		record(inventory, runs.findById(inventory.getFinalRunId()).orElse(null), GhgAuditEvent.Action.PUBLISHED,
				"report issued");
		events.publishEvent(new InventoryPublished(inventoryId, inventory.getFinalRunId()));
		return inventory;
	}

	// --- report metadata (spec 07.4) -------------------------------------------------

	/** The header the accountant types before publication: approver, assurance, intensity denominators. */
	public Inventory setReportMetadata(UUID inventoryId, String approvedBy, AssuranceLevel assuranceLevel,
			String assuranceProvider, String assuranceStatement, String uncertaintyStatement,
			List<IntensityInput> metrics) {
		var inventory = get(inventoryId);
		if (inventory.getStatus() == InventoryStatus.PUBLISHED) {
			throw new GhgRuleViolationException("A published inventory's report header cannot change.");
		}
		access.checkWrite(inventory.getOrganization());
		inventory.setReportMetadata(trimToNull(approvedBy), assuranceLevel, trimToNull(assuranceProvider),
				trimToNull(assuranceStatement), trimToNull(uncertaintyStatement));
		record(inventory, null, GhgAuditEvent.Action.HEADER_SAVED, "report header saved");
		intensityMetrics.deleteAllByInventoryId(inventoryId);
		for (var metric : metrics) {
			intensityMetrics.save(new IntensityMetric(inventory, metric.name().trim(), metric.value(), metric.unit().trim()));
		}
		return inventory;
	}

	public record IntensityInput(String name, BigDecimal value, String unit) {
	}

	@Transactional(readOnly = true)
	public List<IntensityMetric> intensityMetrics(UUID inventoryId) {
		get(inventoryId);
		return intensityMetrics.findAllByInventoryIdOrderByName(inventoryId);
	}

	/** The inventories a correction supersedes, oldest first (spec 07.4: the version chain). */
	@Transactional(readOnly = true)
	public List<Inventory> predecessors(UUID inventoryId) {
		var chain = new ArrayList<Inventory>();
		var current = inventories.findBySupersededById(inventoryId).orElse(null);
		while (current != null && chain.size() < 100) {
			chain.addFirst(current);
			current = inventories.findBySupersededById(current.getId()).orElse(null);
		}
		return chain;
	}

	/**
	 * A correction to a published inventory is a new draft inventory over the
	 * same period and approach, with the boundary, market factors and
	 * operational boundary copied, that supersedes the published one.
	 */
	public Inventory supersede(UUID inventoryId, String name) {
		return supersede(inventoryId, name, null);
	}

	/**
	 * With a reason (spec 05.3): Chapter 5 wants a restatement's reason stated;
	 * the correction records it, inherits the published inventory's whole view
	 * (assignments included), and its report says what changed.
	 */
	public Inventory supersede(UUID inventoryId, String name, String reason) {
		var inventory = get(inventoryId);
		access.checkApprove(inventory.getOrganization());
		if (inventory.getStatus() != InventoryStatus.PUBLISHED) {
			throw new GhgRuleViolationException("Only a published inventory can be superseded.");
		}
		if (inventory.getSupersededById() != null) {
			throw new GhgRuleViolationException("This inventory has already been superseded.");
		}
		var why = trimToNull(reason);
		if (why == null || why.length() < 10) {
			throw new GhgFieldException("reason", "A correction needs a reason of at least 10 characters: "
					+ "what was wrong in the published inventory.");
		}
		var successorName = trimToNull(name) != null ? name.trim() : inventory.getName() + " (correction)";
		var successor = inventories.save(new Inventory(inventory.getOrganization(), successorName,
				inventory.getPeriodStart(), inventory.getPeriodEnd(), inventory.getPurpose(), inventory.getBaseYear(),
				inventory.getConsolidationApproach(), inventory.getGwpSet(), inventory.getStraddleTreatment()));
		copyView(inventory, successor, true);
		successor.setCorrectionReason(why);
		successor.setCopiedFromId(inventory.getId());
		inventory.markSupersededBy(successor);
		record(inventory, null, GhgAuditEvent.Action.CORRECTION_CREATED,
				"correction '" + successorName + "' created: " + why);
		return successor;
	}

	/**
	 * Copies one inventory's view into another (spec 05.3): the boundary with
	 * its windows and overrides, the exclusions, the instruments and residual
	 * mix, the declaration, the report header, and, when asked, every
	 * assignment of a record still on file with its classification or its
	 * exclusion.
	 */
	private void copyView(Inventory source, Inventory target, boolean withAssignments) {
		var sourceId = source.getId();
		target.setOperationalBoundary(source.getScope3Categories(), source.getScope3ExclusionsRationale());
		target.setReportMetadata(source.getApprovedBy(), source.getAssuranceLevel(), source.getAssuranceProvider(),
				source.getAssuranceStatement(), source.getUncertaintyStatement());
		for (var treatment : boundaryTreatments.findAllByInventoryId(sourceId)) {
			if (treatment.getEntity().isDeleted()) {
				continue;
			}
			var copy = new BoundaryTreatment(target, treatment.getEntity());
			copy.update(treatment.getRelationshipType(), treatment.getEconomicInterestPercent(),
					treatment.isOperatedByCompany(), treatment.isControlledByCompany(), treatment.getEffectiveFrom(),
					treatment.getEffectiveTo());
			copy.setFinancialControlOverride(treatment.getFinancialControlOverride());
			treatment.getFacilities()
				.stream()
				.map(BoundaryFacility::getFacility)
				.filter(facility -> !facility.isDeleted())
				.forEach(copy::includeFacility);
			if (!copy.getFacilities().isEmpty()) {
				boundaryTreatments.save(copy);
			}
		}
		for (var factor : marketFactors.findAllByInventoryId(sourceId)) {
			marketFactors.save(new MarketFactor(target, factor.getFacility(), factor.getInstrumentType(),
					factor.getKgCo2ePerKwh(), factor.getSource(), factor.isMeetsQualityCriteria(),
					factor.getQualityNotes(), factor.coverage()));
		}
		target.setResidualMix(source.getResidualMixAvailable(), source.getResidualMixKgCo2ePerKwh());
		for (var exclusion : boundaryExclusions.findAllByInventoryIdOrderByCreatedAtAsc(sourceId)) {
			boundaryExclusions.save(new BoundaryExclusion(target, exclusion.isWholeEntity() ? exclusion.getEntity() : null,
					exclusion.getFacility(), exclusion.getReason(), exclusion.getDetail()));
		}
		for (var metric : intensityMetrics.findAllByInventoryIdOrderByName(sourceId)) {
			intensityMetrics.save(new IntensityMetric(target, metric.getName(), metric.getValue(), metric.getUnit()));
		}
		if (withAssignments) {
			for (var assignment : assignments.findAllByInventoryIdOrderByCreatedAtAsc(sourceId)) {
				if (assignment.getActivity().isDeleted()) {
					continue;
				}
				assignments.save(new InventoryAssignment(target, assignment));
			}
		}
	}

	/** What an inventory inherited from its source, and how many records the source never decided on (spec 05.3). */
	public record Inheritance(UUID sourceInventoryId, String sourceName, long inherited, long undecided,
			String correctionReason) {
	}

	@Transactional(readOnly = true)
	public Optional<Inheritance> inheritance(UUID inventoryId) {
		var inventory = get(inventoryId);
		if (inventory.getCopiedFromId() == null) {
			return Optional.empty();
		}
		var source = inventories.findById(inventory.getCopiedFromId()).orElse(null);
		var all = assignments.findAllByInventoryIdOrderByCreatedAtAsc(inventoryId);
		var inherited = all.stream().filter(InventoryAssignment::isInherited).count();
		var decided = all.stream().map(a -> a.getActivity().getId()).collect(Collectors.toSet());
		var undecided = activities
			.findAllByFacilityOrganizationIdAndDeletedAtIsNullOrderByPeriodEndDesc(inventory.getOrganization().getId())
			.stream()
			.filter(activity -> !decided.contains(activity.getId())
					&& inventory.overlaps(activity.getPeriodStart(), activity.getPeriodEnd()))
			.count();
		return Optional.of(new Inheritance(inventory.getCopiedFromId(), source == null ? null : source.getName(),
				inherited, undecided, inventory.getCorrectionReason()));
	}

	/** Keeps the report exactly as it was published (spec 05.3); the web layer renders it. */
	public void storePublishedReport(UUID inventoryId, String reportJson) {
		var inventory = get(inventoryId);
		if (inventory.getStatus() != InventoryStatus.PUBLISHED) {
			throw new GhgRuleViolationException("Only a published inventory keeps a published report.");
		}
		inventory.setPublishedReport(reportJson);
	}

	/**
	 * The facts as the published run snapshotted them (spec 05.3): a line or an
	 * exclusion per record, so the published inventory's view reads as it was.
	 */
	public record PublishedFact(String activityType, BigDecimal quantity, String unit, LocalDate periodStart,
			LocalDate periodEnd, String evidenceRef) {
	}

	@Transactional(readOnly = true)
	public Map<UUID, PublishedFact> publishedFacts(Inventory inventory) {
		if (inventory.getStatus() != InventoryStatus.PUBLISHED || inventory.getFinalRunId() == null) {
			return Map.of();
		}
		var run = runs.findWithLinesById(inventory.getFinalRunId()).orElse(null);
		if (run == null) {
			return Map.of();
		}
		runs.findWithExclusionsById(run.getId()).ifPresent(withExclusions -> withExclusions.getExclusions().size());
		var facts = new HashMap<UUID, PublishedFact>();
		for (var line : run.getLines()) {
			facts.put(line.getActivityId(), new PublishedFact(line.getActivityType(), line.getQuantity(), line.getUnit(),
					line.getPeriodStart(), line.getPeriodEnd(), line.getEvidenceRef()));
		}
		for (var exclusion : run.getExclusions()) {
			facts.putIfAbsent(exclusion.getActivityId(), new PublishedFact(exclusion.getActivityType(),
					exclusion.getQuantity(), exclusion.getUnit(), exclusion.getPeriodStart(), exclusion.getPeriodEnd(),
					null));
		}
		return facts;
	}

	@Transactional(readOnly = true)
	public List<BoundaryVersion> listBoundaryVersions(UUID inventoryId) {
		get(inventoryId);
		return boundaryVersions.findAllByInventoryIdOrderByVersionNoDesc(inventoryId);
	}

	@Transactional(readOnly = true)
	public BoundaryVersion getBoundaryVersion(UUID versionId) {
		var version = boundaryVersions.findWithEntriesById(versionId)
			.orElseThrow(() -> GhgNotFoundException.boundaryVersion(versionId));
		access.check(version.getInventory().getOrganization());
		return version;
	}

	private void requireEditable(Inventory inventory) {
		access.checkWrite(inventory.getOrganization());
		if (!inventory.isEditable()) {
			throw new GhgRuleViolationException("The inventory is " + inventory.getStatus().name().toLowerCase()
					+ ". Reopen it as a draft to change it.");
		}
	}

	// --- market-based scope 2 (spec 07.1) --------------------------------------

	@Transactional(readOnly = true)
	public List<MarketFactor> marketFactors(UUID inventoryId) {
		get(inventoryId);
		return marketFactors.findAllByInventoryId(inventoryId);
	}

	/**
	 * Records the instrument for a facility: its factor, its Quality Criteria
	 * assessment (spec 07.2) and the kWh and period it covers (spec 07.3).
	 */
	public MarketFactor setMarketFactor(UUID inventoryId, UUID facilityId, MarketInstrument instrument,
			BigDecimal kgCo2ePerKwh, String source, boolean meetsQualityCriteria, String qualityNotes,
			MarketFactor.Coverage coverage) {
		var inventory = get(inventoryId);
		requireEditable(inventory);
		var facility = requireFacility(facilityId, inventory);
		if (coverage.periodStart() != null && coverage.periodEnd() != null
				&& coverage.periodEnd().isBefore(coverage.periodStart())) {
			throw new InvalidPeriodException();
		}
		return marketFactors.findByInventoryIdAndFacilityId(inventoryId, facilityId).map(existing -> {
			existing.update(instrument, kgCo2ePerKwh, source.trim(), meetsQualityCriteria, trimToNull(qualityNotes),
					coverage);
			return existing;
		}).orElseGet(() -> marketFactors.save(new MarketFactor(inventory, facility, instrument, kgCo2ePerKwh,
				source.trim(), meetsQualityCriteria, trimToNull(qualityNotes), coverage)));
	}

	/** Whether an adjusted residual mix is available for the instruments' markets, and its factor when it is (spec 07.2). */
	public Inventory setResidualMix(UUID inventoryId, boolean available, BigDecimal kgCo2ePerKwh) {
		var inventory = get(inventoryId);
		requireEditable(inventory);
		if (available && kgCo2ePerKwh == null) {
			throw new GhgRuleViolationException("A residual mix that is available needs its factor in kg CO2e per kWh.");
		}
		inventory.setResidualMix(available, kgCo2ePerKwh);
		return inventory;
	}

	public void removeMarketFactor(UUID inventoryId, UUID facilityId) {
		requireEditable(get(inventoryId));
		var factor = marketFactors.findByInventoryIdAndFacilityId(inventoryId, facilityId)
			.orElseThrow(() -> GhgNotFoundException.marketFactor(facilityId));
		marketFactors.delete(factor);
	}

	// --- membership ---------------------------------------------------------------

	/** Whether a facility is in the boundary on a date, and if not, why not in words. */
	record Membership(boolean member, String detail) {
		static final Membership IN = new Membership(true, null);
	}

	private Membership membership(List<BoundaryTreatment> treatments, ConsolidationApproach approach,
			UUID facilityId, LocalDate start, LocalDate end) {
		var holder = treatments.stream().filter(treatment -> treatment.includes(facilityId)).findFirst();
		if (holder.isEmpty()) {
			return new Membership(false, "facility not in the boundary");
		}
		var treatment = holder.get();
		if (shareOf(treatment, approach, byEntity(treatments)).signum() == 0) {
			return new Membership(false, treatment.getEntity().getName() + ": 0% accounting share under "
					+ approach.name().toLowerCase().replace('_', ' '));
		}
		if (!treatment.overlaps(start, end)) {
			return new Membership(false, treatment.getEntity().getName() + ": " + treatment.describeWindow());
		}
		return Membership.IN;
	}

	/**
	 * How much of a record's period the live boundary covers (spec 04.2): the
	 * days inside both the reporting period and the entity's membership window,
	 * over the record's days. A record wholly inside is fully covered.
	 */
	private record Straddle(long coveredDays, long totalDays) {
		boolean partial() {
			return coveredDays > 0 && coveredDays < totalDays;
		}
	}

	private Straddle straddle(List<BoundaryTreatment> treatments, Inventory inventory, ActivityRecord activity) {
		var record = activity.period();
		var inside = record.clip(inventory.getPeriodStart(), inventory.getPeriodEnd());
		var holder = treatments.stream().filter(t -> t.includes(activity.getFacility().getId())).findFirst();
		var covered = inside == null || holder.isEmpty() ? null
				: inside.clip(holder.get().getEffectiveFrom(), holder.get().getEffectiveTo());
		return new Straddle(covered == null ? 0 : covered.days(), record.days());
	}

	// --- activity assignments (the view over the facts) ---------------------

	@Transactional(readOnly = true)
	public List<InventoryAssignment> listAssignments(UUID inventoryId) {
		get(inventoryId);
		return assignments.findAllByInventoryIdOrderByCreatedAtAsc(inventoryId);
	}

	/** The activity view's search, filters and page (spec 04.5); status is INCLUDED, EXCLUDED or UNCLASSIFIED. */
	public record AssignmentQuery(String q, UUID facilityId, String status, int page, int size) {
	}

	public record AssignmentPage(List<InventoryAssignment> items, int page, int size, long total, long included,
			long excluded, long unclassified) {
	}

	@Transactional(readOnly = true)
	public AssignmentPage searchAssignments(UUID inventoryId, AssignmentQuery query) {
		get(inventoryId);
		var all = assignments.findAllByInventoryIdOrderByCreatedAtAsc(inventoryId);
		var included = all.stream().filter(a -> a.isIncluded() && a.isClassified()).count();
		var unclassified = all.stream().filter(a -> a.isIncluded() && !a.isClassified()).count();
		var excluded = all.size() - included - unclassified;
		var like = query.q() == null || query.q().isBlank() ? null : query.q().trim().toLowerCase(Locale.ROOT);
		var matching = all.stream().filter(a -> {
			var activity = a.getActivity();
			if (query.facilityId() != null && !activity.getFacility().getId().equals(query.facilityId())) {
				return false;
			}
			if (query.status() != null) {
				var status = !a.isIncluded() ? "EXCLUDED" : a.isClassified() ? "INCLUDED" : "UNCLASSIFIED";
				if (!status.equalsIgnoreCase(query.status())) {
					return false;
				}
			}
			if (like != null) {
				var haystack = (activity.getActivityType() + " " + activity.getFacility().getName() + " "
						+ (activity.getStream() == null ? "" : activity.getStream().getName()) + " "
						+ (a.getEmissionFactor() == null ? "" : a.getEmissionFactor().getName()) + " "
						+ activity.getUnit() + " " + (activity.getEvidenceRef() == null ? "" : activity.getEvidenceRef()))
					.toLowerCase(Locale.ROOT);
				return haystack.contains(like);
			}
			return true;
		}).toList();
		var size = Math.max(1, Math.min(query.size(), 500));
		var from = Math.min(Math.max(0, query.page()) * size, matching.size());
		var items = matching.subList(from, Math.min(from + size, matching.size()));
		return new AssignmentPage(List.copyOf(items), Math.max(0, query.page()), size, matching.size(), included,
				excluded, unclassified);
	}

	/**
	 * Reviews the organization's activity data for this inventory: creates an
	 * assignment for every unreviewed record (auto-excluding outside-period and
	 * outside-boundary ones with a documented reason), and re-evaluates earlier
	 * automatic exclusions whose reason no longer holds (RECON-01). Manual
	 * exclusions are never touched. Draft inventories only.
	 */
	public SyncResult syncAssignments(UUID inventoryId) {
		var inventory = get(inventoryId);
		requireEditable(inventory);
		var reviewed = assignments.findAllByInventoryIdOrderByCreatedAtAsc(inventoryId);
		var existing = reviewed.stream().map(assignment -> assignment.getActivity().getId()).collect(Collectors.toSet());
		var treatments = boundaryTreatments.findAllByInventoryId(inventoryId);

		var created = 0;
		for (var activity : activities
			.findAllByFacilityOrganizationIdAndDeletedAtIsNullOrderByPeriodEndDesc(inventory.getOrganization().getId())) {
			if (existing.contains(activity.getId())) {
				continue;
			}
			var assignment = new InventoryAssignment(inventory, activity);
			applyAutoExclusion(assignment, inventory, treatments);
			assignments.save(assignment);
			created++;
		}

		var updated = 0;
		for (var assignment : reviewed) {
			// spec 04.4: a record removed since the review leaves the view with its tombstone as the reason
			if (assignment.isIncluded() && assignment.getActivity().isDeleted()) {
				applyAutoExclusion(assignment, inventory, treatments);
				updated++;
				continue;
			}
			if (assignment.isIncluded() || !isAutoReason(assignment.getExclusionReason())) {
				continue;
			}
			var before = assignment.getExclusionReason() + "|" + assignment.getExclusionDetail();
			assignment.include();
			applyAutoExclusion(assignment, inventory, treatments);
			var after = assignment.isIncluded() ? "included"
					: assignment.getExclusionReason() + "|" + assignment.getExclusionDetail();
			if (!before.equals(after)) {
				updated++;
			}
		}
		record(inventory, null, GhgAuditEvent.Action.REVIEWED,
				created + " record" + (created == 1 ? "" : "s") + " reviewed, " + updated + " refreshed");
		return new SyncResult(created, updated);
	}

	public record SyncResult(int created, int updated) {
	}

	private void applyAutoExclusion(InventoryAssignment assignment, Inventory inventory,
			List<BoundaryTreatment> treatments) {
		var activity = assignment.getActivity();
		if (activity.isDeleted()) {
			assignment.exclude(ExclusionReason.RECORD_REMOVED, removalDetail(activity));
			return;
		}
		if (!inventory.overlaps(activity.getPeriodStart(), activity.getPeriodEnd())) {
			assignment.exclude(ExclusionReason.OUTSIDE_PERIOD,
					"reporting period " + inventory.getPeriodStart() + " to " + inventory.getPeriodEnd());
			return;
		}
		var membership = membership(treatments, inventory.getConsolidationApproach(), activity.getFacility().getId(),
				activity.getPeriodStart(), activity.getPeriodEnd());
		if (!membership.member()) {
			assignment.exclude(ExclusionReason.OUTSIDE_BOUNDARY, membership.detail());
		}
	}

	private static boolean isAutoReason(ExclusionReason reason) {
		return reason != null && reason.isAutomatic();
	}

	private static String removalDetail(ActivityRecord activity) {
		var detail = "removed " + activity.getDeletedAt().toString().substring(0, 10) + " by "
				+ activity.getDeletedBy() + ": " + activity.getDeleteReason();
		return detail.length() > 255 ? detail.substring(0, 252) + "..." : detail;
	}

	/**
	 * Classifies an included record: the factor and the scope and category the
	 * accountant chose (spec 04.1). With a lease type, the scope and category
	 * derive from Appendix F under the inventory's approach.
	 */
	public InventoryAssignment classify(UUID assignmentId, UUID emissionFactorId, Scope scope,
			ActivityCategory category, LeaseType leaseType, String scopeJustification, boolean proxy,
			String proxyJustification, UUID densityId) {
		return classify(assignmentId, emissionFactorId, scope, category, leaseType, scopeJustification, proxy,
				proxyJustification, densityId, false);
	}

	/**
	 * With the facility's lease (spec 03.4): a record whose period overlaps the
	 * facility's lease inherits its lease type unless one is chosen by hand or
	 * {@code ignoreFacilityLease} says the record is not under it.
	 */
	public InventoryAssignment classify(UUID assignmentId, UUID emissionFactorId, Scope scope,
			ActivityCategory category, LeaseType leaseType, String scopeJustification, boolean proxy,
			String proxyJustification, UUID densityId, boolean ignoreFacilityLease) {
		var assignment = getAssignment(assignmentId);
		requireEditable(assignment.getInventory());
		if (leaseType == null && !ignoreFacilityLease) {
			leaseType = inheritedLease(assignment);
		}
		var factor = emissionFactors.findById(emissionFactorId)
			.orElseThrow(() -> GhgNotFoundException.emissionFactor(emissionFactorId));
		// spec 02.2: a record in mass against a factor per litre (or the reverse) needs a density
		var organizationId = assignment.getInventory().getOrganization().getId();
		var units = organizationUnits.forOrganization(organizationId);
		Density density = null;
		if (Conversion.needsDensity(units, assignment.getActivity().getUnit(), factor.getUnit())) {
			if (densityId == null) {
				throw new GhgFieldException("densityId", "'" + assignment.getActivity().getActivityType()
						+ "' is recorded in " + assignment.getActivity().getUnit() + " and '" + factor.getName()
						+ "' is per " + factor.getUnit() + ": choose the density that converts between them.");
			}
			density = densities.findById(densityId).orElseThrow(() -> GhgNotFoundException.density(densityId));
			if (density.getOrganizationId() != null && !density.getOrganizationId().equals(organizationId)) {
				throw GhgNotFoundException.density(densityId);
			}
		}
		// spec 04.3: the stream fixes the default; without one the factor suggests it
		var stream = assignment.getActivity().getStream();
		var defaultScope = stream != null ? stream.defaultScope() : factor.getDefaultScope();
		var defaultCategory = stream != null ? stream.defaultCategory() : factor.getDefaultCategory();
		Scope chosenScope;
		ActivityCategory chosenCategory;
		if (leaseType != null) {
			var derived = leaseType.derive(assignment.getInventory().getConsolidationApproach(), defaultScope,
					defaultCategory);
			chosenScope = derived.scope();
			chosenCategory = derived.category();
		}
		else {
			chosenScope = scope != null ? scope : defaultScope;
			chosenCategory = category != null ? category : chosenScope == defaultScope ? defaultCategory : null;
			if (chosenCategory == null) {
				throw new GhgRuleViolationException("Choose a " + chosenScope.name().toLowerCase().replace('_', ' ')
						+ " category for '" + factor.getName() + "'.");
			}
			if (chosenCategory.scope() != chosenScope) {
				throw new GhgRuleViolationException(chosenCategory + " is a " + chosenCategory.scope()
					.name()
					.toLowerCase()
					.replace('_', ' ') + " category, not " + chosenScope.name().toLowerCase().replace('_', ' ') + ".");
			}
			if (stream != null && !stream.getKind().categories().contains(chosenCategory)) {
				throw new GhgRuleViolationException(chosenCategory + " is not a category a "
						+ stream.getKind().name().toLowerCase().replace('_', ' ') + " stream ('" + stream.getName()
						+ "') can be classified into.");
			}
		}
		var departs = leaseType == null && chosenScope != defaultScope;
		var justification = trimToNull(scopeJustification);
		if (proxy && trimToNull(proxyJustification) == null) {
			throw new GhgRuleViolationException("A proxy factor needs a justification: say what the factor stands in for.");
		}
		assignment.classify(factor, chosenScope, chosenCategory, leaseType, departs ? justification : null, proxy,
				proxy ? trimToNull(proxyJustification) : null, density);
		record(assignment.getInventory(), null, GhgAuditEvent.Action.CLASSIFIED, "'" + assignment.getActivity().getActivityType()
				+ "' classified as " + scopeName(chosenScope) + ", " + chosenCategory.name().toLowerCase().replace('_', ' ')
				+ ", with '" + factor.getName() + "'" + (proxy ? " (proxy)" : ""));
		return assignment;
	}

	/**
	 * A manual exclusion. When the reason is one review would give (outside the
	 * period or the boundary), the detail is computed the same way, so the
	 * report reads alike whoever excluded the record.
	 */
	public InventoryAssignment exclude(UUID assignmentId, ExclusionReason reason, String justification,
			BigDecimal estimatedKgCo2e) {
		var assignment = getAssignment(assignmentId);
		var inventory = assignment.getInventory();
		requireEditable(inventory);
		if (reason == ExclusionReason.RECORD_REMOVED) {
			throw new GhgRuleViolationException(
					"'Record removed' is the reason the review records for a removed record; choose another reason.");
		}
		var words = trimToNull(justification);
		if (!reason.isAutomatic()) {
			// spec 04.4: Chapter 9 wants each exclusion justified and its magnitude estimated
			if (words == null || words.length() < 10) {
				throw new GhgFieldException("justification",
						"A record exclusion needs a justification of at least 10 characters.");
			}
			if (estimatedKgCo2e == null || estimatedKgCo2e.signum() < 0) {
				throw new GhgFieldException("estimatedKgCo2e",
						"Estimate the emissions left out, in kg CO2e (0 when the record emits nothing).");
			}
		}
		String detail = null;
		var activity = assignment.getActivity();
		if (reason == ExclusionReason.OUTSIDE_PERIOD
				&& !inventory.overlaps(activity.getPeriodStart(), activity.getPeriodEnd())) {
			detail = "reporting period " + inventory.getPeriodStart() + " to " + inventory.getPeriodEnd();
		}
		else if (reason == ExclusionReason.OUTSIDE_BOUNDARY) {
			var membership = membership(boundaryTreatments.findAllByInventoryId(inventory.getId()),
					inventory.getConsolidationApproach(), activity.getFacility().getId(), activity.getPeriodStart(),
					activity.getPeriodEnd());
			detail = membership.member() ? null : membership.detail();
		}
		assignment.exclude(reason, detail, words, reason.isAutomatic() ? null : estimatedKgCo2e);
		return assignment;
	}

	public InventoryAssignment include(UUID assignmentId) {
		var assignment = getAssignment(assignmentId);
		requireEditable(assignment.getInventory());
		assignment.include();
		return assignment;
	}

	/** The lease the record's facility is under over the record's period (spec 03.4), or null. */
	static LeaseType inheritedLease(InventoryAssignment assignment) {
		var activity = assignment.getActivity();
		return activity.getFacility().leaseOver(activity.getPeriodStart(), activity.getPeriodEnd());
	}

	/** The grid factor suggested for a record's facility (spec 03.4): the newest approved one of its region. */
	public record Suggestion(UUID factorId, String factorName) {
	}

	@Transactional(readOnly = true)
	public Map<UUID, Suggestion> suggestions(List<InventoryAssignment> assignments) {
		var result = new HashMap<UUID, Suggestion>();
		if (assignments.isEmpty()) {
			return result;
		}
		var organizationId = assignments.getFirst().getInventory().getOrganization().getId();
		var byRegion = new HashMap<String, EmissionFactor>();
		for (var factor : emissionFactors
			.findAllByOrganizationIdIsNullOrOrganizationIdOrderByDefaultScopeAscNameAsc(organizationId)) {
			if (factor.getGridRegion() == null || !factor.isApproved()
					|| factor.getDefaultCategory() != ActivityCategory.PURCHASED_ELECTRICITY) {
				continue;
			}
			var current = byRegion.get(factor.getGridRegion());
			var newer = current == null || year(factor) > year(current)
					|| (year(factor) == year(current) && current.getOrganizationId() == null
							&& factor.getOrganizationId() != null);
			if (newer) {
				byRegion.put(factor.getGridRegion(), factor);
			}
		}
		for (var assignment : assignments) {
			var activity = assignment.getActivity();
			var stream = activity.getStream();
			var electricity = stream != null ? stream.getKind() == StreamKind.PURCHASED_ELECTRICITY
					: assignment.getCategory() == ActivityCategory.PURCHASED_ELECTRICITY
							|| activity.getUnit().toLowerCase(Locale.ROOT).endsWith("wh");
			var region = activity.getFacility().effectiveGridRegion();
			if (!electricity || region == null) {
				continue;
			}
			var factor = byRegion.get(region);
			if (factor != null) {
				result.put(assignment.getId(), new Suggestion(factor.getId(), factor.getName()));
			}
		}
		return result;
	}

	private static int year(EmissionFactor factor) {
		return factor.getDataYear() != null ? factor.getDataYear()
				: factor.getPublicationYear() != null ? factor.getPublicationYear() : 0;
	}

	// --- validation gates ----------------------------------------------------

	@Transactional(readOnly = true)
	public Report validate(UUID inventoryId) {
		var inventory = get(inventoryId);
		var units = organizationUnits.forOrganization(inventory.getOrganization().getId());
		var approach = inventory.getConsolidationApproach();
		var treatments = boundaryTreatments.findAllByInventoryId(inventoryId);
		var allAssignments = assignments.findAllByInventoryIdOrderByCreatedAtAsc(inventoryId);
		var included = allAssignments.stream().filter(InventoryAssignment::isIncluded).toList();
		var reviewedActivityIds = allAssignments.stream()
			.map(assignment -> assignment.getActivity().getId())
			.collect(Collectors.toSet());
		var orgActivities = activities
			.findAllByFacilityOrganizationIdAndDeletedAtIsNullOrderByPeriodEndDesc(inventory.getOrganization().getId());
		var baseYear = baseYears.of(inventory.getOrganization().getId()).orElse(null);
		var wholeYear = baseYear != null
				&& baseYear.getStructuralChangeConvention() == StructuralChangeConvention.WHOLE_YEAR;
		var instruments = marketFactors.findAllByInventoryId(inventoryId)
			.stream()
			.collect(Collectors.toMap(factor -> factor.getFacility().getId(), Function.identity()));

		var boundaryFindings = new ArrayList<Finding>();
		if (treatments.isEmpty()) {
			boundaryFindings.add(new Finding(Severity.ERROR,
					"The organizational boundary is empty: add at least one facility."));
		}
		else if (inventory.isEditable()) {
			boundaryFindings.add(new Finding(Severity.ERROR,
					"The inventory is a draft. Freeze it to enable a run."));
		}
		if (inventory.months() != 12) {
			// spec 04.2: Chapter 9 expects an annual inventory; anything else is allowed but must be deliberate
			boundaryFindings.add(new Finding(Severity.WARNING, "The reporting period " + inventory.getPeriodStart()
					+ " to " + inventory.getPeriodEnd() + " is not twelve months"
					+ (inventory.months() > 0 ? " (" + inventory.months() + " months)" : "")
					+ ". Chapter 9 expects an annual inventory; keep it only if the period is deliberate."));
		}
		var treatmentsByEntity = byEntity(treatments);
		for (var treatment : treatments) {
			var entity = treatment.getEntity();
			if (shareOf(treatment, approach, treatmentsByEntity).signum() == 0) {
				boundaryFindings.add(new Finding(Severity.WARNING, entity.getName()
						+ " has a 0% accounting share under " + approach.name().toLowerCase().replace('_', ' ')
						+ ": it is outside the boundary under this approach. Remove it, or leave it and the version "
						+ "records it as excluded."));
			}
			var drifted = treatment.getRelationshipType() != entity.getRelationshipType()
					|| treatment.getEconomicInterestPercent().compareTo(entity.getEconomicInterestPercent()) != 0
					|| treatment.isOperatedByCompany() != entity.isOperatedByCompany()
					|| treatment.isControlledByCompany() != entity.isControlledByCompany();
			if (drifted) {
				// spec 03: the treatment is a decision and stays put; the accountant reconciles
				boundaryFindings.add(new Finding(Severity.WARNING, entity.getName() + "'s treatment ("
						+ describeFacts(treatment.getRelationshipType(), treatment.getEconomicInterestPercent(),
								treatment.isOperatedByCompany())
						+ ") differs from the entity record (" + describeFacts(entity.getRelationshipType(),
								entity.getEconomicInterestPercent(), entity.isOperatedByCompany())
						+ "). Review the boundary."));
			}
			if (treatment.isPartialWithin(inventory.getPeriodStart(), inventory.getPeriodEnd())) {
				boundaryFindings.add(new Finding(Severity.WARNING, entity.getName() + " is a "
						+ treatment.describeWindow() + ": a partial-period membership, accounted from that date."));
				if (wholeYear) {
					// spec 06.1: the policy says a mid-year change is accounted for the entire year
					boundaryFindings.add(new Finding(Severity.WARNING, entity.getName()
							+ " has a membership window, but the recalculation policy accounts structural changes "
							+ "for the whole year. Include the full year of the operation, or change the convention."));
				}
			}
		}
		for (var assignment : included) {
			var activity = assignment.getActivity();
			var membership = membership(treatments, approach, activity.getFacility().getId(),
					activity.getPeriodStart(), activity.getPeriodEnd());
			if (!membership.member()) {
				boundaryFindings.add(new Finding(Severity.ERROR,
						"Included activity '" + activity.getActivityType() + "' (" + activity.getFacility().getName()
								+ ", " + activity.period().describe() + ") is outside the boundary ("
								+ membership.detail() + "): exclude it or change the boundary."));
			}
		}
		if (!treatments.isEmpty()) {
			// spec 07.2: an operation left out of the boundary is an exclusion Chapter 9 requires a reason for
			for (var omitted : undocumentedOmissions(inventoryId, inventory.getOrganization().getId(), treatments)) {
				boundaryFindings.add(new Finding(Severity.ERROR, "'" + omitted.getName() + "' ("
						+ omitted.getEntity().getName() + ") is neither in the boundary nor excluded with a reason. "
						+ "Tick it in, or record why it is left out."));
			}
		}

		var completenessFindings = new ArrayList<Finding>();
		var unreviewed = orgActivities.stream()
			.filter(activity -> !reviewedActivityIds.contains(activity.getId()))
			.count();
		if (unreviewed > 0) {
			completenessFindings.add(new Finding(Severity.WARNING, unreviewed + " organizational activity record"
					+ (unreviewed == 1 ? " has" : "s have") + " not been reviewed: run \"Review activity data\"."));
		}
		for (var assignment : allAssignments) {
			if (assignment.isIncluded() || !isAutoReason(assignment.getExclusionReason())) {
				continue;
			}
			var activity = assignment.getActivity();
			var inPeriod = inventory.overlaps(activity.getPeriodStart(), activity.getPeriodEnd());
			var stillOutside = !inPeriod || !membership(treatments, approach, activity.getFacility().getId(),
					activity.getPeriodStart(), activity.getPeriodEnd()).member();
			if (!stillOutside) {
				completenessFindings.add(new Finding(Severity.WARNING,
						"'" + activity.getActivityType() + "' (" + activity.period().describe()
								+ ") is excluded for a reason that no longer holds: run \"Review activity data\"."));
			}
		}
		for (var assignment : included) {
			var activity = assignment.getActivity();
			if (activity.isDeleted()) {
				completenessFindings.add(new Finding(Severity.ERROR, "'" + activity.getActivityType() + "' ("
						+ activity.period().describe() + ") was removed (" + removalDetail(activity)
						+ ") but is still included: run \"Review activity data\"."));
				continue;
			}
			if (!inventory.overlaps(activity.getPeriodStart(), activity.getPeriodEnd())) {
				completenessFindings.add(new Finding(Severity.ERROR,
						"Included activity '" + activity.getActivityType() + "' covers " + activity.period().describe()
								+ ", outside the reporting period: exclude it."));
			}
			else {
				// spec 04.2: a record straddling the period or the membership window is pro-rated or blocked
				var straddle = straddle(treatments, inventory, activity);
				if (straddle.partial()) {
					var percent = BigDecimal.valueOf(straddle.coveredDays())
						.multiply(BigDecimal.valueOf(100))
						.divide(BigDecimal.valueOf(straddle.totalDays()), 2, RoundingMode.HALF_UP)
						.stripTrailingZeros()
						.toPlainString();
					var where = "'" + activity.getActivityType() + "' (" + activity.getFacility().getName() + ") covers "
							+ activity.period().describe() + "; " + straddle.coveredDays() + " of " + straddle.totalDays()
							+ " days fall inside the reporting period and the membership window";
					if (inventory.getStraddleTreatment() == StraddleTreatment.BLOCK) {
						completenessFindings.add(new Finding(Severity.ERROR, where
								+ ". The inventory blocks straddling records: split the record at the cut-off or exclude it."));
					}
					else {
						completenessFindings.add(new Finding(Severity.WARNING,
								where + ": the run pro-rates it to " + percent + "%."));
					}
				}
			}
			if (activity.getEvidenceRef() == null) {
				completenessFindings.add(new Finding(Severity.WARNING, "'" + activity.getActivityType() + "' ("
						+ activity.period().describe() + ") has no evidence reference."));
			}
			if (activity.getDataQuality() != DataQuality.MEASURED || activity.getDataQualityTier() >= 4) {
				completenessFindings.add(new Finding(Severity.INFO,
						"'" + activity.getActivityType() + "' (" + activity.period().describe() + ") is "
								+ activity.getDataQuality().name().toLowerCase() + " data, tier "
								+ activity.getDataQualityTier() + " (" + DataQualityTier.label(activity.getDataQualityTier())
								+ ")" + (activity.getUncertaintyPercent() == null ? "" : ", uncertainty ±"
										+ activity.getUncertaintyPercent().stripTrailingZeros().toPlainString() + "%") + "."));
			}
		}

		var classificationFindings = new ArrayList<Finding>();
		for (var assignment : included) {
			var activity = assignment.getActivity();
			if (!assignment.isClassified()) {
				classificationFindings.add(new Finding(Severity.ERROR,
						"'" + activity.getActivityType() + "' (" + activity.getFacility().getName() + ", "
								+ activity.period().describe()
								+ ") is unclassified: assign an emission factor or exclude it."));
				continue;
			}
			// spec 04.3: scope is a choice; a departure from the stream's (or factor's) default needs a reason
			var factor = assignment.getEmissionFactor();
			var stream = activity.getStream();
			var defaultScope = stream != null ? stream.defaultScope() : factor.getDefaultScope();
			var departs = assignment.getLeaseType() == null && assignment.getScope() != defaultScope;
			if (departs && assignment.getScopeJustification() == null) {
				classificationFindings.add(new Finding(Severity.ERROR, "'" + activity.getActivityType()
						+ "' is classified in " + scopeName(assignment.getScope()) + "; "
						+ (stream != null ? "its stream '" + stream.getName() + "'" : "'" + factor.getName() + "'")
						+ " defaults to " + scopeName(defaultScope)
						+ ". Record why (a justification of at least 10 characters), or classify it in "
						+ scopeName(defaultScope) + "."));
			}
		}

		var factorFindings = new ArrayList<Finding>();
		var co2eOnlyNamed = new java.util.HashSet<UUID>();
		for (var assignment : included) {
			if (!assignment.isClassified()) {
				continue;
			}
			var activity = assignment.getActivity();
			var activityUnit = activity.getUnit();
			var factorUnit = assignment.getEmissionFactor().getUnit();
			// spec 02.1: an unapproved factor blocks; a validity window or a CO2e-only source is disclosed
			var chosen = assignment.getEmissionFactor();
			if (!chosen.isApproved()) {
				factorFindings.add(new Finding(Severity.ERROR, "'" + activity.getActivityType() + "' uses '"
						+ chosen.getName() + "', which is not approved. Approve it under Emission factors, or choose another."));
			}
			else if (!chosen.coversPeriod(inventory.getPeriodStart(), inventory.getPeriodEnd())) {
				factorFindings.add(new Finding(Severity.WARNING, "'" + chosen.getName() + "' is valid "
						+ (chosen.getValidFrom() == null ? "until " + chosen.getValidTo()
								: "from " + chosen.getValidFrom() + (chosen.getValidTo() == null ? "" : " until " + chosen.getValidTo()))
						+ ", which does not cover the reporting period."));
			}
			if (chosen.isCo2eOnly() && co2eOnlyNamed.add(chosen.getId())) {
				factorFindings.add(new Finding(Severity.WARNING, "'" + chosen.getName()
						+ "' publishes CO2e only: the by-gas table carries no CH4 or N2O for it, and the report says so."));
			}
			if (Conversion.needsDensity(units, activityUnit, factorUnit)) {
				// spec 02.2: mass and volume meet through a density; a typical value is disclosed
				if (assignment.getDensity() == null) {
					factorFindings.add(new Finding(Severity.ERROR, "'" + activity.getActivityType()
							+ "' is recorded in " + describeUnit(units, activityUnit) + " but its factor '"
							+ chosen.getName() + "' is per " + describeUnit(units, factorUnit)
							+ ": choose the density that converts between them (record one under Units if none fits)."));
				}
				else if (assignment.getDensity().isTypical()) {
					factorFindings.add(new Finding(Severity.WARNING, "'" + activity.getActivityType()
							+ "' converts through the typical density of " + assignment.getDensity().getMaterial() + " ("
							+ plain(assignment.getDensity().getKgPerLitre())
							+ " kg/litre). Replace it with the supplier's specification before a final run."));
				}
			}
			else if (!isReconcilable(units, activityUnit, factorUnit)) {
				factorFindings.add(new Finding(Severity.ERROR, "'" + activity.getActivityType()
						+ "' is recorded in " + describeUnit(units, activityUnit) + " but its factor '"
						+ assignment.getEmissionFactor().getName() + "' is per " + describeUnit(units, factorUnit)
						+ ": no conversion between them. Record it in a unit compatible with " + factorUnit
						+ ", choose a factor in " + activityUnit + ", or define " + activityUnit
						+ " as a custom unit under Units."));
			}
			if (assignment.getScope() == Scope.SCOPE_2 && instruments.containsKey(activity.getFacility().getId())
					&& !units.canConvert(activityUnit, KWH)) {
				factorFindings.add(new Finding(Severity.WARNING, "'" + activity.getActivityType() + "' at "
						+ activity.getFacility().getName() + " has a market-based factor per kWh but is recorded in "
						+ describeUnit(units, activityUnit) + ": the market-based figure falls back to location-based."));
			}
		}
		if (inventory.getResidualMixAvailable() == null) {
			// spec 07.3: every run reports market-based, so the Guidance's residual-mix disclosure is always due
			factorFindings.add(new Finding(Severity.WARNING, "The inventory does not say whether a residual mix is "
					+ "available. Every run reports scope 2 market-based, and the Scope 2 Guidance requires the "
					+ "disclosure either way; until it is recorded, uncovered electricity is priced at the grid average."));
		}
		for (var instrument : instruments.values()) {
			if (!instrument.isMeetsQualityCriteria()) {
				factorFindings.add(new Finding(Severity.WARNING, "The instrument for " + instrument.getFacility().getName()
						+ " does not meet the Scope 2 Quality Criteria: the market-based figure falls back to "
						+ (Boolean.TRUE.equals(inventory.getResidualMixAvailable()) ? "the residual mix."
								: "location-based.")));
			}
			if (instrument.getPeriodStart() != null && instrument.getPeriodStart().isBefore(inventory.getPeriodStart())
					|| instrument.getPeriodEnd() != null && instrument.getPeriodEnd().isAfter(inventory.getPeriodEnd())) {
				factorFindings.add(new Finding(Severity.WARNING, "The instrument for " + instrument.getFacility().getName()
						+ " covers " + instrument.effectiveStart(inventory) + " to " + instrument.effectiveEnd(inventory)
						+ ", which reaches outside the reporting period; only the part inside it applies."));
			}
			if (instrument.getCoveredKwh() != null) {
				var electricity = included.stream()
					.filter(assignment -> assignment.getScope() == Scope.SCOPE_2
							&& assignment.getCategory() == ActivityCategory.PURCHASED_ELECTRICITY)
					.filter(assignment -> assignment.getActivity().getFacility().getId().equals(instrument.getFacility().getId()))
					.filter(assignment -> instrument.overlaps(assignment.getActivity().getPeriodStart(),
							assignment.getActivity().getPeriodEnd(), inventory))
					.filter(assignment -> units.canConvert(assignment.getActivity().getUnit(), KWH))
					.map(assignment -> units.convert(assignment.getActivity().getQuantity(),
							assignment.getActivity().getUnit(), KWH))
					.reduce(BigDecimal.ZERO, BigDecimal::add);
				if (instrument.getCoveredKwh().compareTo(electricity) > 0) {
					factorFindings.add(new Finding(Severity.WARNING, "The instrument for "
							+ instrument.getFacility().getName() + " covers " + kwh(instrument.getCoveredKwh())
							+ " kWh but the facility's scope 2 electricity in its period is " + kwh(electricity)
							+ " kWh: the excess covers nothing."));
				}
			}
		}

		var baseYearFindings = new ArrayList<Finding>();
		for (var flag : baseYears.unresolvedFlags(inventory.getOrganization().getId())) {
			var ownBaseYear = flag.getBaseYear().getInventory().getId().equals(inventoryId);
			var severity = flag.isAboveThreshold() && !ownBaseYear ? Severity.ERROR : Severity.WARNING;
			baseYearFindings.add(new Finding(severity, "Base year flagged for recalculation (" + flag.getReason()
					+ "). Record the decision under the organization's base year."));
		}
		if (baseYear != null && !baseYear.getInventory().getId().equals(inventoryId)
				&& baseYear.getInventory().getGwpSet() != inventory.getGwpSet()) {
			// the 2013 amendment: the same GWP values for the current period and the base year
			baseYearFindings.add(new Finding(Severity.WARNING, "This inventory uses IPCC " + inventory.getGwpSet()
					+ " potentials; the " + baseYear.year() + " base year uses IPCC "
					+ baseYear.getInventory().getGwpSet()
					+ ". The required-gases amendment recommends the same set for both."));
		}
		if (baseYear != null) {
			for (var label : baseYears.recalculatedBasesWithWindows(baseYear)) {
				baseYearFindings.add(new Finding(Severity.WARNING, "The recalculated base '" + label
						+ "' carries a membership window, but the policy accounts structural changes for the whole "
						+ "year. Recalculate the base for the entire year, or change the convention."));
			}
		}

		return new Report(List.of(new GateResult(Gate.BOUNDARY, List.copyOf(boundaryFindings)),
				new GateResult(Gate.COMPLETENESS, List.copyOf(completenessFindings)),
				new GateResult(Gate.CLASSIFICATION, List.copyOf(classificationFindings)),
				new GateResult(Gate.EMISSION_FACTOR, List.copyOf(factorFindings)),
				new GateResult(Gate.BASE_YEAR, List.copyOf(baseYearFindings))));
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
		// a second fetch for the exclusions avoids a cartesian product of the two collections
		runs.findWithExclusionsById(id).ifPresent(withExclusions -> withExclusions.getExclusions().size());
		runs.findWithFactorsById(id).ifPresent(withFactors -> withFactors.getFactors().size());
		return run;
	}

	/**
	 * Validates the inventory view and, if no gate blocks, snapshots it into an
	 * immutable run: quantity x factor x accounting share per included
	 * assignment, per gas (spec 05, 07.1), plus every excluded assignment with
	 * its reason (spec 05.1).
	 */
	public GhgRun executeRun(UUID inventoryId, String label) {
		var inventory = get(inventoryId);
		access.checkWrite(inventory.getOrganization());
		if (!inventory.getStatus().allowsRuns()) {
			throw new GhgRuleViolationException(inventory.isEditable()
					? "The inventory is a draft. Freeze it to enable a run."
					: "A published inventory cannot be recalculated. Create a correction that supersedes it.");
		}
		var report = validate(inventoryId);
		if (!report.ready()) {
			var errorCount = report.gates()
				.stream()
				.flatMap(gate -> gate.findings().stream())
				.filter(finding -> finding.severity() == Severity.ERROR)
				.count();
			throw new ValidationBlockedException(errorCount);
		}
		// the gate guarantees a frozen boundary, so shares come from its version,
		// never from live treatments: the arithmetic and the cited version cannot
		// disagree (spec 03)
		var version = boundaryVersions.findWithEntriesById(inventory.getCurrentBoundaryVersionId())
			.orElseThrow(() -> GhgNotFoundException.boundaryVersion(inventory.getCurrentBoundaryVersionId()));
		Map<UUID, MarketFactor> instruments = marketFactors.findAllByInventoryId(inventoryId)
			.stream()
			.collect(Collectors.toMap(factor -> factor.getFacility().getId(), Function.identity()));
		var gwp = inventory.getGwpSet();
		var units = organizationUnits.forOrganization(inventory.getOrganization().getId());
		// spec 05.2: one more than the highest number ever issued, voided runs included
		var runNo = runs.findTopByInventoryIdOrderByRunNoDesc(inventoryId).map(last -> last.getRunNo() + 1).orElse(1);
		var run = new GhgRun(inventory, runNo, label.trim(), access.currentUserEmail());
		var factorsUsed = new java.util.LinkedHashMap<UUID, EmissionFactor>();
		// spec 07.3: each instrument is applied to the kWh it covers, line by line, until used up
		var remainingCoverage = new HashMap<UUID, BigDecimal>();
		instruments.forEach((facilityId, instrument) -> remainingCoverage.put(facilityId, instrument.getCoveredKwh()));
		// in date order, so an instrument is consumed chronologically (spec 07.3)
		var evidenceByActivity = new HashMap<UUID, List<String>>();
		var activityIds = assignments.findAllByInventoryIdOrderByCreatedAtAsc(inventoryId)
			.stream()
			.map(a -> a.getActivity().getId())
			.toList();
		if (!activityIds.isEmpty()) {
			for (var item : evidence.findAllByActivityIdIn(activityIds)) {
				evidenceByActivity.computeIfAbsent(item.getActivityId(), k -> new ArrayList<>()).add(item.getName());
			}
		}
		var ordered = assignments.findAllByInventoryIdOrderByCreatedAtAsc(inventoryId)
			.stream()
			.sorted(java.util.Comparator.comparing((InventoryAssignment a) -> a.getActivity().getPeriodStart())
				.thenComparing(a -> a.getActivity().getPeriodEnd())
				.thenComparing(a -> a.getActivity().getCreatedAt()))
			.toList();
		for (var assignment : ordered) {
			if (!assignment.isIncluded()) {
				run.addExclusion(new GhgRunExclusion(run, assignment));
				continue;
			}
			var activity = assignment.getActivity();
			var factor = assignment.getEmissionFactor();
			factorsUsed.putIfAbsent(factor.getId(), factor);
			// spec 04.2: the share over the record's period, pro-rated by the days the version covers
			var coverage = version.coverage(activity.getFacility().getId(), activity.getPeriodStart(),
					activity.getPeriodEnd(), inventory.getPeriodStart(), inventory.getPeriodEnd());
			var share = coverage.coveredDays() == 0 ? BigDecimal.ZERO : coverage.share();
			var periodShare = coverage.coveredDays() == coverage.totalDays() ? BigDecimal.ONE
					: BigDecimal.valueOf(coverage.coveredDays())
						.divide(BigDecimal.valueOf(coverage.totalDays()), 6, RoundingMode.HALF_UP);
			var period = new GhgRunLine.Period(activity.getPeriodStart(), activity.getPeriodEnd(),
					coverage.totalDays(), coverage.coveredDays(), periodShare,
					periodShare.compareTo(BigDecimal.ONE) == 0 ? null
							: "pro-rated: " + coverage.coveredDays() + " of " + coverage.totalDays()
									+ " days inside the reporting period and the membership window ("
									+ periodShare.movePointRight(2).setScale(2, RoundingMode.HALF_UP).stripTrailingZeros().toPlainString()
									+ "%)");
			var quantity = activity.getQuantity();
			var activityUnit = activity.getUnit();
			var factorUnit = factor.getUnit();
			// spec 02.2: within a dimension, through a custom unit, or through a density; the gate proved it converts
			var conversion = Conversion.of(units, quantity, activityUnit, factorUnit, assignment.getDensity())
				.orElse(new Conversion(quantity, BigDecimal.ONE, null, false));
			var conversionFactor = conversion.factor();
			var convertedQuantity = conversion.convertedQuantity();
			var perUnit = factor.kgCo2ePerUnit(gwp);
			var counted = convertedQuantity.multiply(periodShare);
			var kgCo2e = round(counted.multiply(perUnit).multiply(share));
			var gases = new GhgRunLine.Gases(round(convertedQuantity.multiply(factor.getCo2KgPerUnit()).multiply(share)),
					round(convertedQuantity.multiply(factor.getCh4KgPerUnit()).multiply(share)),
					round(convertedQuantity.multiply(factor.getN2oKgPerUnit()).multiply(share)),
					round(convertedQuantity.multiply(factor.hfcsKgCo2ePerUnit(gwp)).multiply(share)),
					round(convertedQuantity.multiply(factor.pfcsKgCo2ePerUnit(gwp)).multiply(share)),
					round(convertedQuantity.multiply(factor.getSf6KgPerUnit()).multiply(share)),
					round(convertedQuantity.multiply(factor.getNf3KgPerUnit()).multiply(share)),
					round(convertedQuantity.multiply(factor.getBiogenicCo2KgPerUnit()).multiply(share)),
					round(convertedQuantity.multiply(factor.getHfcsKgPerUnit()).multiply(share)),
					round(convertedQuantity.multiply(factor.getPfcsKgPerUnit()).multiply(share)),
					factor.blendGwpSourceFor(gwp), factor.isCh4Fossil());
			GhgRunLine.Market market = null;
			if (assignment.getScope() == Scope.SCOPE_2) {
				market = marketBased(units, inventory, assignment, instruments.get(activity.getFacility().getId()),
						remainingCoverage, counted, perUnit, share, periodShare, kgCo2e);
			}
			var files = evidenceByActivity.get(activity.getId());
			var evidenceFiles = files == null ? null : String.join(", ", files);
			run.addLine(new GhgRunLine(run, assignment, convertedQuantity, conversionFactor, perUnit, share, period,
					kgCo2e, gases, market, evidenceFiles != null && evidenceFiles.length() > 1000
							? evidenceFiles.substring(0, 997) + "..." : evidenceFiles,
					conversion.note() != null && conversion.note().length() > 500
							? conversion.note().substring(0, 497) + "..." : conversion.note()));
		}
		// spec 07.4: the frozen factor set behind the report's factor table
		for (var factor : factorsUsed.values()) {
			run.addFactor(new GhgRunFactor(run, factor, gwp));
		}
		run = runs.save(run);
		record(inventory, run, GhgAuditEvent.Action.RUN_LAUNCHED, "run " + run.getRunNo() + " '" + run.getLabel() + "' launched");
		events.publishEvent(new GhgRunCompleted(run.getId(), inventoryId, run.getTotalKgCo2e()));
		return run;
	}

	/**
	 * Voids a run with a reason (spec 05.2). The run keeps its number, lines
	 * and totals; nothing is deleted. A final run must have its designation
	 * withdrawn first, and a published inventory's runs are a record.
	 */
	public GhgRun voidRun(UUID id, String reason) {
		var run = getRun(id);
		var inventory = run.getInventory();
		access.checkWrite(inventory.getOrganization());
		if (inventory.getStatus() == InventoryStatus.PUBLISHED) {
			throw new GhgRuleViolationException("A published inventory's runs are a record and cannot be voided.");
		}
		if (id.equals(inventory.getFinalRunId())) {
			throw new GhgRuleViolationException("Run " + run.getRunNo()
					+ " is designated final. Withdraw the designation, with a reason, before voiding it.");
		}
		if (run.isVoided()) {
			throw new GhgRuleViolationException("Run " + run.getRunNo() + " is already voided.");
		}
		run.markVoid(access.currentUserId(), access.currentUserEmail(), reason.trim());
		auditEvents.save(new GhgAuditEvent(inventory.getId(), run, GhgAuditEvent.Action.RUN_VOIDED,
				access.currentUserId(), access.currentUserEmail(), reason.trim()));
		return run;
	}

	// --- coverage (spec 04.2) -----------------------------------------------------

	/**
	 * Which months of the inventory period have data, per facility and stream
	 * (spec 04.5), or per activity type for records without a stream. Every
	 * stream of a facility in the boundary has a row, so a stream with no data
	 * at all shows as empty months.
	 */
	public record CoverageRow(UUID facilityId, String facilityName, UUID streamId, String streamName,
			String activityType, List<String> months, List<String> coveredMonths) {
	}

	@Transactional(readOnly = true)
	public List<CoverageRow> coverage(UUID inventoryId) {
		var inventory = get(inventoryId);
		var boundaryFacilityIds = boundaryTreatments.findAllByInventoryId(inventoryId)
			.stream()
			.flatMap(t -> t.getFacilities().stream())
			.map(member -> member.getFacility().getId())
			.collect(Collectors.toSet());
		var months = new ArrayList<java.time.YearMonth>();
		for (var month = java.time.YearMonth.from(inventory.getPeriodStart()); !month
			.isAfter(java.time.YearMonth.from(inventory.getPeriodEnd())); month = month.plusMonths(1)) {
			months.add(month);
		}
		var labels = months.stream().map(java.time.YearMonth::toString).toList();
		var rows = new java.util.LinkedHashMap<String, CoverageRow>();
		var covered = new java.util.LinkedHashMap<String, java.util.TreeSet<String>>();
		for (var stream : streams.findAllByFacilityOrganizationIdOrderByNameAsc(inventory.getOrganization().getId())) {
			if (boundaryFacilityIds.contains(stream.getFacility().getId())) {
				var key = stream.getFacility().getId() + "|stream|" + stream.getId();
				rows.put(key, new CoverageRow(stream.getFacility().getId(), stream.getFacility().getName(),
						stream.getId(), stream.getName(), null, labels, List.of()));
				covered.put(key, new java.util.TreeSet<>());
			}
		}
		for (var assignment : assignments.findAllByInventoryIdOrderByCreatedAtAsc(inventoryId)) {
			if (!assignment.isIncluded()) {
				continue;
			}
			var activity = assignment.getActivity();
			var stream = activity.getStream();
			var key = stream != null ? activity.getFacility().getId() + "|stream|" + stream.getId()
					: activity.getFacility().getId() + "|type|" + activity.getActivityType().toLowerCase(Locale.ROOT);
			rows.computeIfAbsent(key, k -> new CoverageRow(activity.getFacility().getId(),
					activity.getFacility().getName(), stream == null ? null : stream.getId(),
					stream == null ? null : stream.getName(), stream == null ? activity.getActivityType() : null, labels,
					List.of()));
			var set = covered.computeIfAbsent(key, k -> new java.util.TreeSet<>());
			for (var month : months) {
				if (activity.period().overlaps(month.atDay(1), month.atEndOfMonth())) {
					set.add(month.toString());
				}
			}
		}
		return rows.entrySet()
			.stream()
			.map(entry -> new CoverageRow(entry.getValue().facilityId(), entry.getValue().facilityName(),
					entry.getValue().streamId(), entry.getValue().streamName(), entry.getValue().activityType(), labels,
					List.copyOf(covered.get(entry.getKey()))))
			.sorted(java.util.Comparator.comparing(CoverageRow::facilityName)
				.thenComparing(row -> row.streamName() != null ? row.streamName() : row.activityType(),
						String.CASE_INSENSITIVE_ORDER))
			.toList();
	}

	// --- market-based scope 2 (spec 07.3) --------------------------------------

	/**
	 * The market-based side of a scope 2 line: the facility's instrument applied
	 * to the kWh it still covers, the balance at the residual mix or the grid
	 * average (the line's own location-based factor), and a note that prints
	 * the split. Purchased heat, steam and cooling, and lines that do not
	 * convert to kWh, keep their location-based figure.
	 */
	private GhgRunLine.Market marketBased(UnitConverter.Scoped units, Inventory inventory,
			InventoryAssignment assignment, MarketFactor instrument, Map<UUID, BigDecimal> remainingCoverage,
			BigDecimal convertedQuantity, BigDecimal perUnit, BigDecimal share, BigDecimal periodShare,
			BigDecimal locationKgCo2e) {
		var activity = assignment.getActivity();
		if (assignment.getCategory() != ActivityCategory.PURCHASED_ELECTRICITY) {
			return new GhgRunLine.Market(locationKgCo2e, null, null, "no contractual instrument applies to "
					+ assignment.getCategory().name().toLowerCase().replace('_', ' ')
					+ "; the location-based figure stands", BigDecimal.ZERO, BigDecimal.ZERO, null, null);
		}
		if (!units.canConvert(activity.getUnit(), KWH)) {
			return new GhgRunLine.Market(locationKgCo2e, null, null, "recorded in " + activity.getUnit()
					+ ", which does not convert to kWh; the location-based figure stands", BigDecimal.ZERO,
					BigDecimal.ZERO, null, null);
		}
		// the kWh the run counts: the record's, pro-rated like the location-based side (spec 04.2)
		var kwh = units.convert(activity.getQuantity(), activity.getUnit(), KWH).multiply(periodShare);
		var locationPerKwh = kwh.signum() == 0 ? BigDecimal.ZERO
				: convertedQuantity.multiply(perUnit).divide(kwh, MathContext.DECIMAL64);
		var covered = BigDecimal.ZERO;
		BigDecimal instrumentFactor = null;
		MarketInstrument applied = null;
		var parts = new ArrayList<String>();
		if (instrument == null) {
			parts.add("no contractual instrument");
		}
		else if (!instrument.overlaps(activity.getPeriodStart(), activity.getPeriodEnd(), inventory)) {
			parts.add("the facility's instrument covers " + instrument.effectiveStart(inventory) + " to "
					+ instrument.effectiveEnd(inventory) + ", not this record's period");
		}
		else if (!instrument.isMeetsQualityCriteria()) {
			// Scope 2 Guidance: an instrument that fails the Quality Criteria is replaced by other data
			parts.add("the facility's instrument does not meet the Scope 2 Quality Criteria and was not applied");
		}
		else {
			var facilityId = activity.getFacility().getId();
			var left = remainingCoverage.get(facilityId);
			covered = left == null ? kwh : kwh.min(left.max(BigDecimal.ZERO));
			if (left != null) {
				remainingCoverage.put(facilityId, left.subtract(covered));
			}
			if (covered.signum() > 0) {
				instrumentFactor = instrument.getKgCo2ePerKwh();
				applied = instrument.getInstrumentType();
				parts.add(kwh(covered) + " kWh at " + plain(instrumentFactor) + " kg/kWh ("
						+ instrument.getInstrumentType().name().toLowerCase().replace('_', ' ') + ")");
			}
			else {
				parts.add("the facility's instrument is used up by earlier records");
			}
		}
		var balance = kwh.subtract(covered);
		var residualAvailable = Boolean.TRUE.equals(inventory.getResidualMixAvailable())
				&& inventory.getResidualMixKgCo2ePerKwh() != null;
		var balanceFactor = residualAvailable ? inventory.getResidualMixKgCo2ePerKwh() : locationPerKwh;
		Scope2MarketBasis basis = null;
		if (balance.signum() > 0) {
			basis = residualAvailable ? Scope2MarketBasis.RESIDUAL_MIX : Scope2MarketBasis.GRID_AVERAGE;
			parts.add(kwh(balance) + " kWh at " + plain(balanceFactor) + " kg/kWh (" + (residualAvailable
					? "residual mix"
					: "grid average: the location-based figure stands, " + (inventory.getResidualMixAvailable() == null
							? "residual-mix availability not stated" : "no residual mix is available"))
					+ ")");
		}
		var kgCo2e = round(covered.multiply(instrumentFactor == null ? BigDecimal.ZERO : instrumentFactor)
			.add(balance.multiply(balanceFactor))
			.multiply(share));
		var reported = applied != null ? applied
				: basis == Scope2MarketBasis.RESIDUAL_MIX ? MarketInstrument.RESIDUAL_MIX : null;
		var factorShown = instrumentFactor != null ? instrumentFactor : balance.signum() > 0 ? balanceFactor : null;
		return new GhgRunLine.Market(kgCo2e, factorShown, reported, String.join("; ", parts), covered, balance,
				balance.signum() > 0 ? balanceFactor : null, basis);
	}

	private static final DecimalFormat KWH_FORMAT = new DecimalFormat("#,##0.###",
			DecimalFormatSymbols.getInstance(Locale.ROOT));

	private static String kwh(BigDecimal value) {
		return KWH_FORMAT.format(value);
	}

	private static String plain(BigDecimal value) {
		return value.stripTrailingZeros().toPlainString();
	}

	/** One line of the inventory's history (spec 01.2): the act, who did it, and a detail. */
	private void record(Inventory inventory, GhgRun run, GhgAuditEvent.Action action, String detail) {
		auditEvents.save(new GhgAuditEvent(inventory.getId(), run, action, access.currentUserId(),
				access.currentUserEmail(), detail));
	}

	// --- helpers -------------------------------------------------------------

	private static BigDecimal round(BigDecimal value) {
		return value.setScale(3, RoundingMode.HALF_UP);
	}

	private InventoryAssignment getAssignment(UUID id) {
		var assignment = assignments.findWithDetailsById(id)
			.orElseThrow(() -> GhgNotFoundException.assignment(id));
		access.check(assignment.getInventory().getOrganization());
		return assignment;
	}

	private Facility requireFacility(UUID facilityId, Inventory inventory) {
		var facility = facilities.findById(facilityId).orElseThrow(() -> GhgNotFoundException.facility(facilityId));
		if (!facility.getOrganization().getId().equals(inventory.getOrganization().getId())) {
			throw GhgNotFoundException.facility(facilityId);
		}
		return facility;
	}

	private LegalEntity requireEntity(UUID entityId, Inventory inventory) {
		var entity = entities.findById(entityId).orElseThrow(() -> GhgNotFoundException.entity(entityId));
		if (!entity.getOrganization().getId().equals(inventory.getOrganization().getId())) {
			throw GhgNotFoundException.entity(entityId);
		}
		return entity;
	}

	/**
	 * Whether an activity's unit can drive its factor: a dimensional conversion
	 * exists, or (for custom/unrecognized units) the two strings match exactly.
	 */
	private static boolean isReconcilable(UnitConverter.Scoped units, String activityUnit, String factorUnit) {
		return units.canConvert(activityUnit, factorUnit) || activityUnit.equalsIgnoreCase(factorUnit);
	}

	/** Table 1 facts for messages, e.g. "joint venture, 40%, operated". */
	private static String describeFacts(RelationshipType relationship, BigDecimal interest, boolean operated) {
		return relationship.name().toLowerCase().replace('_', ' ') + ", "
				+ interest.stripTrailingZeros().toPlainString() + "%, " + (operated ? "operated" : "not operated");
	}

	private static String scopeName(Scope scope) {
		return scope.name().toLowerCase().replace('_', ' ');
	}

	/** A unit with its dimension for error messages, e.g. "kg (mass)" or "widgets (unrecognized)". */
	private static String describeUnit(UnitConverter.Scoped units, String unit) {
		return units.dimensionOf(unit)
			.map(dimension -> unit + " (" + dimension.name().toLowerCase().replace('_', ' ') + ")")
			.orElse(unit + " (unrecognized)");
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
