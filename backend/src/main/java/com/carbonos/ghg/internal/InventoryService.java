package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
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
	private final BaseYearService baseYears;
	private final ApplicationEventPublisher events;
	private final GhgAccess access;
	private final UnitConverter units;

	InventoryService(OrganizationRepository organizations, LegalEntityRepository entities,
			FacilityRepository facilities, ActivityRecordRepository activities,
			EmissionFactorRepository emissionFactors, InventoryRepository inventories,
			BoundaryTreatmentRepository boundaryTreatments, BoundaryVersionRepository boundaryVersions,
			BoundaryExclusionRepository boundaryExclusions, InventoryAssignmentRepository assignments,
			MarketFactorRepository marketFactors, GhgRunRepository runs, BaseYearService baseYears,
			ApplicationEventPublisher events, GhgAccess access, UnitConverter units) {
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
		this.baseYears = baseYears;
		this.events = events;
		this.access = access;
		this.units = units;
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
			String purpose, Integer baseYear, ConsolidationApproach approach, GwpSet gwpSet) {
		requirePeriod(periodStart, periodEnd);
		var organization = organizations.findById(organizationId)
			.orElseThrow(() -> GhgNotFoundException.organization(organizationId));
		access.check(organization);
		return inventories.save(new Inventory(organization, name.trim(), periodStart, periodEnd, trimToNull(purpose),
				baseYear, approach, gwpSet == null ? GwpSet.AR5 : gwpSet));
	}

	public Inventory update(UUID id, String name, LocalDate periodStart, LocalDate periodEnd, String purpose,
			Integer baseYear, ConsolidationApproach approach, GwpSet gwpSet) {
		requirePeriod(periodStart, periodEnd);
		var inventory = get(id);
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
		return inventory;
	}

	public void delete(UUID id) {
		var inventory = get(id);
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
			boolean clearWindow) {
		static TreatmentInput none() {
			return new TreatmentInput(null, null, null, null, null, null, false);
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
		var facilitiesByEntity = facilities.findAllByOrganizationIdOrderByCreatedAtAsc(organizationId)
			.stream()
			.collect(Collectors.groupingBy(facility -> facility.getEntity().getId()));
		var exclusions = boundaryExclusions.findAllByInventoryIdOrderByCreatedAtAsc(inventoryId);
		var byEntity = exclusions.stream()
			.filter(BoundaryExclusion::isWholeEntity)
			.collect(Collectors.toMap(exclusion -> exclusion.getEntity().getId(), Function.identity()));
		var byFacility = exclusions.stream()
			.filter(exclusion -> !exclusion.isWholeEntity())
			.collect(Collectors.toMap(exclusion -> exclusion.getFacility().getId(), Function.identity()));
		return entities.findAllByOrganizationIdOrderByReportingCompanyDescCreatedAtAsc(organizationId)
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
		return facilities.findAllByOrganizationIdOrderByCreatedAtAsc(organizationId)
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
			facilities.findAllByOrganizationIdOrderByCreatedAtAsc(inventory.getOrganization().getId())
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
		return version;
	}

	/** Reopens a frozen inventory for editing. Versions already cut are untouched. */
	public Inventory reopen(UUID inventoryId) {
		var inventory = get(inventoryId);
		switch (inventory.getStatus()) {
			case DRAFT -> throw new GhgRuleViolationException("The inventory is already a draft.");
			case FINAL -> throw new GhgRuleViolationException(
					"A run is designated final. Withdraw the designation before reopening the inventory.");
			case PUBLISHED -> throw new GhgRuleViolationException(
					"A published inventory cannot change. Create a correction that supersedes it.");
			case FROZEN -> inventory.reopen();
		}
		return inventory;
	}

	/** Designates a run as the final one of its inventory, which moves the inventory to FINAL. */
	public Inventory designateFinal(UUID inventoryId, UUID runId) {
		var inventory = get(inventoryId);
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
		inventory.designateFinal(runId);
		return inventory;
	}

	public Inventory withdrawFinal(UUID inventoryId) {
		var inventory = get(inventoryId);
		if (inventory.getStatus() != InventoryStatus.FINAL) {
			throw new GhgRuleViolationException("No run is designated final.");
		}
		inventory.withdrawFinal();
		return inventory;
	}

	/** Issues the report: the inventory becomes a record and nothing on it may change afterwards. */
	public Inventory publish(UUID inventoryId) {
		var inventory = get(inventoryId);
		if (inventory.getStatus() != InventoryStatus.FINAL) {
			throw new GhgRuleViolationException("Designate a final run before publishing the inventory.");
		}
		inventory.publish();
		events.publishEvent(new InventoryPublished(inventoryId, inventory.getFinalRunId()));
		return inventory;
	}

	/**
	 * A correction to a published inventory is a new draft inventory over the
	 * same period and approach, with the boundary, market factors and
	 * operational boundary copied, that supersedes the published one.
	 */
	public Inventory supersede(UUID inventoryId, String name) {
		var inventory = get(inventoryId);
		if (inventory.getStatus() != InventoryStatus.PUBLISHED) {
			throw new GhgRuleViolationException("Only a published inventory can be superseded.");
		}
		if (inventory.getSupersededById() != null) {
			throw new GhgRuleViolationException("This inventory has already been superseded.");
		}
		var successorName = trimToNull(name) != null ? name.trim() : inventory.getName() + " (correction)";
		var successor = inventories.save(new Inventory(inventory.getOrganization(), successorName,
				inventory.getPeriodStart(), inventory.getPeriodEnd(), inventory.getPurpose(), inventory.getBaseYear(),
				inventory.getConsolidationApproach(), inventory.getGwpSet()));
		successor.setOperationalBoundary(inventory.getScope3Categories(), inventory.getScope3ExclusionsRationale());
		for (var treatment : boundaryTreatments.findAllByInventoryId(inventoryId)) {
			var copy = new BoundaryTreatment(successor, treatment.getEntity());
			copy.update(treatment.getRelationshipType(), treatment.getEconomicInterestPercent(),
					treatment.isOperatedByCompany(), treatment.isControlledByCompany(), treatment.getEffectiveFrom(),
					treatment.getEffectiveTo());
			treatment.getFacilities().forEach(member -> copy.includeFacility(member.getFacility()));
			boundaryTreatments.save(copy);
		}
		for (var factor : marketFactors.findAllByInventoryId(inventoryId)) {
			marketFactors.save(new MarketFactor(successor, factor.getFacility(), factor.getInstrumentType(),
					factor.getKgCo2ePerKwh(), factor.getSource(), factor.isMeetsQualityCriteria(),
					factor.getQualityNotes()));
		}
		successor.setResidualMix(inventory.getResidualMixAvailable(), inventory.getResidualMixKgCo2ePerKwh());
		for (var exclusion : boundaryExclusions.findAllByInventoryIdOrderByCreatedAtAsc(inventoryId)) {
			boundaryExclusions.save(new BoundaryExclusion(successor, exclusion.isWholeEntity() ? exclusion.getEntity() : null,
					exclusion.getFacility(), exclusion.getReason(), exclusion.getDetail()));
		}
		inventory.markSupersededBy(successor);
		return successor;
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

	private static void requireEditable(Inventory inventory) {
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

	public MarketFactor setMarketFactor(UUID inventoryId, UUID facilityId, MarketInstrument instrument,
			BigDecimal kgCo2ePerKwh, String source, boolean meetsQualityCriteria, String qualityNotes) {
		var inventory = get(inventoryId);
		requireEditable(inventory);
		var facility = requireFacility(facilityId, inventory);
		return marketFactors.findByInventoryIdAndFacilityId(inventoryId, facilityId).map(existing -> {
			existing.update(instrument, kgCo2ePerKwh, source.trim(), meetsQualityCriteria, trimToNull(qualityNotes));
			return existing;
		}).orElseGet(() -> marketFactors.save(new MarketFactor(inventory, facility, instrument, kgCo2ePerKwh,
				source.trim(), meetsQualityCriteria, trimToNull(qualityNotes))));
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
			UUID facilityId, LocalDate date) {
		var holder = treatments.stream().filter(treatment -> treatment.includes(facilityId)).findFirst();
		if (holder.isEmpty()) {
			return new Membership(false, "facility not in the boundary");
		}
		var treatment = holder.get();
		if (shareOf(treatment, approach, byEntity(treatments)).signum() == 0) {
			return new Membership(false, treatment.getEntity().getName() + ": 0% accounting share under "
					+ approach.name().toLowerCase().replace('_', ' '));
		}
		if (!treatment.covers(date)) {
			return new Membership(false, treatment.getEntity().getName() + ": " + treatment.describeWindow());
		}
		return Membership.IN;
	}

	// --- activity assignments (the view over the facts) ---------------------

	@Transactional(readOnly = true)
	public List<InventoryAssignment> listAssignments(UUID inventoryId) {
		get(inventoryId);
		return assignments.findAllByInventoryIdOrderByCreatedAtAsc(inventoryId);
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
			.findAllByFacilityOrganizationIdOrderByActivityDateDesc(inventory.getOrganization().getId())) {
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
		return new SyncResult(created, updated);
	}

	public record SyncResult(int created, int updated) {
	}

	private void applyAutoExclusion(InventoryAssignment assignment, Inventory inventory,
			List<BoundaryTreatment> treatments) {
		var activity = assignment.getActivity();
		if (!inventory.covers(activity.getActivityDate())) {
			assignment.exclude(ExclusionReason.OUTSIDE_PERIOD,
					"reporting period " + inventory.getPeriodStart() + " to " + inventory.getPeriodEnd());
			return;
		}
		var membership = membership(treatments, inventory.getConsolidationApproach(), activity.getFacility().getId(),
				activity.getActivityDate());
		if (!membership.member()) {
			assignment.exclude(ExclusionReason.OUTSIDE_BOUNDARY, membership.detail());
		}
	}

	private static boolean isAutoReason(ExclusionReason reason) {
		return reason == ExclusionReason.OUTSIDE_PERIOD || reason == ExclusionReason.OUTSIDE_BOUNDARY;
	}

	/**
	 * Classifies an included record: the factor and the scope and category the
	 * accountant chose (spec 04.1). With a lease type, the scope and category
	 * derive from Appendix F under the inventory's approach.
	 */
	public InventoryAssignment classify(UUID assignmentId, UUID emissionFactorId, Scope scope,
			ActivityCategory category, LeaseType leaseType) {
		var assignment = getAssignment(assignmentId);
		requireEditable(assignment.getInventory());
		var factor = emissionFactors.findById(emissionFactorId)
			.orElseThrow(() -> GhgNotFoundException.emissionFactor(emissionFactorId));
		Scope chosenScope;
		ActivityCategory chosenCategory;
		if (leaseType != null) {
			var derived = leaseType.derive(assignment.getInventory().getConsolidationApproach(),
					factor.getDefaultScope(), factor.getDefaultCategory());
			chosenScope = derived.scope();
			chosenCategory = derived.category();
		}
		else {
			chosenScope = scope != null ? scope : factor.getDefaultScope();
			chosenCategory = category != null ? category
					: chosenScope == factor.getDefaultScope() ? factor.getDefaultCategory() : null;
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
		}
		assignment.classify(factor, chosenScope, chosenCategory, leaseType);
		return assignment;
	}

	/**
	 * A manual exclusion. When the reason is one review would give (outside the
	 * period or the boundary), the detail is computed the same way, so the
	 * report reads alike whoever excluded the record.
	 */
	public InventoryAssignment exclude(UUID assignmentId, ExclusionReason reason) {
		var assignment = getAssignment(assignmentId);
		var inventory = assignment.getInventory();
		requireEditable(inventory);
		String detail = null;
		var activity = assignment.getActivity();
		if (reason == ExclusionReason.OUTSIDE_PERIOD && !inventory.covers(activity.getActivityDate())) {
			detail = "reporting period " + inventory.getPeriodStart() + " to " + inventory.getPeriodEnd();
		}
		else if (reason == ExclusionReason.OUTSIDE_BOUNDARY) {
			var membership = membership(boundaryTreatments.findAllByInventoryId(inventory.getId()),
					inventory.getConsolidationApproach(), activity.getFacility().getId(), activity.getActivityDate());
			detail = membership.member() ? null : membership.detail();
		}
		assignment.exclude(reason, detail);
		return assignment;
	}

	public InventoryAssignment include(UUID assignmentId) {
		var assignment = getAssignment(assignmentId);
		requireEditable(assignment.getInventory());
		assignment.include();
		return assignment;
	}

	// --- validation gates ----------------------------------------------------

	@Transactional(readOnly = true)
	public Report validate(UUID inventoryId) {
		var inventory = get(inventoryId);
		var approach = inventory.getConsolidationApproach();
		var treatments = boundaryTreatments.findAllByInventoryId(inventoryId);
		var allAssignments = assignments.findAllByInventoryIdOrderByCreatedAtAsc(inventoryId);
		var included = allAssignments.stream().filter(InventoryAssignment::isIncluded).toList();
		var reviewedActivityIds = allAssignments.stream()
			.map(assignment -> assignment.getActivity().getId())
			.collect(Collectors.toSet());
		var orgActivities = activities
			.findAllByFacilityOrganizationIdOrderByActivityDateDesc(inventory.getOrganization().getId());
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
					activity.getActivityDate());
			if (!membership.member()) {
				boundaryFindings.add(new Finding(Severity.ERROR,
						"Included activity '" + activity.getActivityType() + "' (" + activity.getFacility().getName()
								+ ", " + activity.getActivityDate() + ") is outside the boundary ("
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
			var inPeriod = inventory.covers(activity.getActivityDate());
			var stillOutside = !inPeriod || !membership(treatments, approach, activity.getFacility().getId(),
					activity.getActivityDate()).member();
			if (!stillOutside) {
				completenessFindings.add(new Finding(Severity.WARNING,
						"'" + activity.getActivityType() + "' (" + activity.getActivityDate()
								+ ") is excluded for a reason that no longer holds: run \"Review activity data\"."));
			}
		}
		for (var assignment : included) {
			var activity = assignment.getActivity();
			if (!inventory.covers(activity.getActivityDate())) {
				completenessFindings.add(new Finding(Severity.ERROR,
						"Included activity '" + activity.getActivityType() + "' is dated " + activity.getActivityDate()
								+ ", outside the reporting period: exclude it."));
			}
			if (activity.getEvidenceRef() == null) {
				completenessFindings.add(new Finding(Severity.WARNING, "'" + activity.getActivityType() + "' ("
						+ activity.getActivityDate() + ") has no evidence reference."));
			}
			if (activity.getDataQuality() != DataQuality.MEASURED) {
				completenessFindings.add(new Finding(Severity.INFO,
						"'" + activity.getActivityType() + "' (" + activity.getActivityDate() + ") is "
								+ activity.getDataQuality().name().toLowerCase() + " data."));
			}
		}

		var classificationFindings = new ArrayList<Finding>();
		for (var assignment : included) {
			var activity = assignment.getActivity();
			if (!assignment.isClassified()) {
				classificationFindings.add(new Finding(Severity.ERROR,
						"'" + activity.getActivityType() + "' (" + activity.getFacility().getName() + ", "
								+ activity.getActivityDate()
								+ ") is unclassified: assign an emission factor or exclude it."));
				continue;
			}
			var factor = assignment.getEmissionFactor();
			var leased = assignment.getLeaseType() != null && assignment.getScope() == Scope.SCOPE_3;
			if (!leased && !factor.compatibleWith(assignment.getScope())) {
				classificationFindings.add(new Finding(Severity.ERROR, "'" + activity.getActivityType()
						+ "' is classified in " + scopeName(assignment.getScope()) + " with '" + factor.getName()
						+ "', a " + scopeName(factor.getDefaultScope()) + " factor whose scope is inherent."));
			}
			else if (assignment.getScope() != factor.getDefaultScope()) {
				classificationFindings.add(new Finding(Severity.WARNING, "'" + activity.getActivityType()
						+ "' is classified in " + scopeName(assignment.getScope()) + "; '" + factor.getName()
						+ "' suggests " + scopeName(factor.getDefaultScope())
						+ (assignment.getLeaseType() != null ? " (leased asset, Appendix F)" : "") + "."));
			}
		}

		var factorFindings = new ArrayList<Finding>();
		for (var assignment : included) {
			if (!assignment.isClassified()) {
				continue;
			}
			var activity = assignment.getActivity();
			var activityUnit = activity.getUnit();
			var factorUnit = assignment.getEmissionFactor().getUnit();
			if (!isReconcilable(activityUnit, factorUnit)) {
				factorFindings.add(new Finding(Severity.ERROR, "'" + activity.getActivityType()
						+ "' is recorded in " + describeUnit(activityUnit) + " but its factor '"
						+ assignment.getEmissionFactor().getName() + "' is per " + describeUnit(factorUnit)
						+ ": no conversion between them. Record it in a unit compatible with " + factorUnit
						+ ", or choose a factor in " + activityUnit + "."));
			}
			if (assignment.getScope() == Scope.SCOPE_2 && instruments.containsKey(activity.getFacility().getId())
					&& !units.canConvert(activityUnit, KWH)) {
				factorFindings.add(new Finding(Severity.WARNING, "'" + activity.getActivityType() + "' at "
						+ activity.getFacility().getName() + " has a market-based factor per kWh but is recorded in "
						+ describeUnit(activityUnit) + ": the market-based figure falls back to location-based."));
			}
		}
		if (!instruments.isEmpty() && inventory.getResidualMixAvailable() == null) {
			factorFindings.add(new Finding(Severity.WARNING, "The inventory has contractual instruments but does not "
					+ "say whether a residual mix is available. The Scope 2 Guidance requires the disclosure either way."));
		}
		for (var instrument : instruments.values()) {
			if (!instrument.isMeetsQualityCriteria()) {
				factorFindings.add(new Finding(Severity.WARNING, "The instrument for " + instrument.getFacility().getName()
						+ " does not meet the Scope 2 Quality Criteria: the market-based figure falls back to "
						+ (Boolean.TRUE.equals(inventory.getResidualMixAvailable()) ? "the residual mix."
								: "location-based.")));
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
		var run = new GhgRun(inventory, label.trim(), !instruments.isEmpty());
		for (var assignment : assignments.findAllByInventoryIdOrderByCreatedAtAsc(inventoryId)) {
			if (!assignment.isIncluded()) {
				run.addExclusion(new GhgRunExclusion(run, assignment));
				continue;
			}
			var activity = assignment.getActivity();
			var factor = assignment.getEmissionFactor();
			var share = version.shareOf(activity.getFacility().getId(), activity.getActivityDate())
				.orElse(BigDecimal.ZERO);
			var quantity = activity.getQuantity();
			var activityUnit = activity.getUnit();
			var factorUnit = factor.getUnit();
			var convertsDimensionally = units.canConvert(activityUnit, factorUnit);
			var conversionFactor = convertsDimensionally ? units.ratio(activityUnit, factorUnit) : BigDecimal.ONE;
			var convertedQuantity = convertsDimensionally ? units.convert(quantity, activityUnit, factorUnit) : quantity;
			var perUnit = factor.kgCo2ePerUnit(gwp);
			var kgCo2e = round(convertedQuantity.multiply(perUnit).multiply(share));
			var gases = new GhgRunLine.Gases(round(convertedQuantity.multiply(factor.getCo2KgPerUnit()).multiply(share)),
					round(convertedQuantity.multiply(factor.getCh4KgPerUnit()).multiply(share)),
					round(convertedQuantity.multiply(factor.getN2oKgPerUnit()).multiply(share)),
					round(convertedQuantity.multiply(factor.getHfcsKgCo2ePerUnit()).multiply(share)),
					round(convertedQuantity.multiply(factor.getPfcsKgCo2ePerUnit()).multiply(share)),
					round(convertedQuantity.multiply(factor.getSf6KgPerUnit()).multiply(share)),
					round(convertedQuantity.multiply(factor.getNf3KgPerUnit()).multiply(share)),
					round(convertedQuantity.multiply(factor.getBiogenicCo2KgPerUnit()).multiply(share)),
					round(convertedQuantity.multiply(factor.getHfcsKgPerUnit()).multiply(share)),
					round(convertedQuantity.multiply(factor.getPfcsKgPerUnit()).multiply(share)),
					factor.getBlendGwpSource());
			GhgRunLine.Market market = null;
			var instrument = instruments.get(activity.getFacility().getId());
			if (assignment.getScope() == Scope.SCOPE_2 && instrument != null && units.canConvert(activityUnit, KWH)) {
				var kwh = units.convert(quantity, activityUnit, KWH);
				if (instrument.isMeetsQualityCriteria()) {
					market = new GhgRunLine.Market(round(kwh.multiply(instrument.getKgCo2ePerKwh()).multiply(share)),
							instrument.getKgCo2ePerKwh(), instrument.getInstrumentType(), null);
				}
				else if (Boolean.TRUE.equals(inventory.getResidualMixAvailable())
						&& inventory.getResidualMixKgCo2ePerKwh() != null) {
					// Scope 2 Guidance: an instrument that fails the Quality Criteria is replaced by other data
					var residual = inventory.getResidualMixKgCo2ePerKwh();
					market = new GhgRunLine.Market(round(kwh.multiply(residual).multiply(share)), residual,
							MarketInstrument.RESIDUAL_MIX, "the facility's instrument does not meet the Scope 2 "
									+ "Quality Criteria; the residual mix was applied instead");
				}
				else {
					market = new GhgRunLine.Market(kgCo2e, null, instrument.getInstrumentType(),
							"the facility's instrument does not meet the Scope 2 Quality Criteria and no residual "
									+ "mix is available; the location-based figure stands");
				}
			}
			run.addLine(new GhgRunLine(run, assignment, convertedQuantity, conversionFactor, perUnit, share, kgCo2e,
					gases, market));
		}
		run = runs.save(run);
		events.publishEvent(new GhgRunCompleted(run.getId(), inventoryId, run.getTotalKgCo2e()));
		return run;
	}

	public void deleteRun(UUID id) {
		var run = getRun(id);
		var inventory = run.getInventory();
		if (inventory.getStatus() == InventoryStatus.PUBLISHED) {
			throw new GhgRuleViolationException("A published inventory's runs are a record and cannot be deleted.");
		}
		if (id.equals(inventory.getFinalRunId())) {
			// deleting the final run withdraws the designation without promoting another
			inventories.findById(inventory.getId()).ifPresent(Inventory::withdrawFinal);
		}
		runs.delete(run);
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
	private boolean isReconcilable(String activityUnit, String factorUnit) {
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
	private String describeUnit(String unit) {
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
