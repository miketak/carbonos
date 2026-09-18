package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;

/**
 * Importing an edition as an organization's factors (spec 02.6). A publication
 * row identifier is a <em>lineage</em>, not a row: a lineage holds one version
 * per vintage, and a factor's identity is the organization, the code, and the
 * version's {@code valid_from}.
 *
 * <p>The import never mutates a value on an incumbent version. It creates a
 * lineage it does not hold, leaves a locally edited row alone and reports it,
 * treats the same edition as a no-op, adds a tag when the values are identical,
 * and otherwise closes the incumbent and inserts a new version starting on the
 * edition's applies-from date. Approval carries forward, because approval is a
 * decision the organization made about the lineage; a row the edition itself
 * publishes unapproved produces an unapproved version.
 *
 * <p>Nothing here reaches a past run. {@code ghg_run_lines.factor_id} and
 * {@code ghg_run_factors.factor_id} are plain identifiers with no foreign key,
 * and a run records the values it applied, so cutting a version leaves every
 * reported figure exactly as it was reported.
 */
@Service
@Transactional
public class FactorPackImportService {

	/** The inventories whose period is no longer the organization's to change (spec 05.1). */
	private static final List<InventoryStatus> LOCKED = List.of(InventoryStatus.FROZEN, InventoryStatus.FINAL,
			InventoryStatus.PUBLISHED);

	/**
	 * Rows applied between flushes. Importing defra-2026 into an organization
	 * that already holds it walks 1,868 lineages in one request, so the work is
	 * written in batches and the counters are kept outside the persistence
	 * context.
	 */
	private static final int BATCH = 500;

	/**
	 * What an import did (spec 02.6). {@code edition} is the edition that was
	 * imported, not the pack family: the field spec 02.3 called {@code pack} is
	 * renamed here, once, with the counts that versioning adds.
	 *
	 * <p>{@code created} is lineages the organization did not hold,
	 * {@code versioned} is versions cut, {@code tagged} is rows another edition
	 * had already delivered whose values match exactly, and {@code unchanged} is
	 * rows this same edition already delivered.
	 */
	public record ImportResult(String edition, LocalDate appliesFrom, int created, int versioned, int tagged,
			int unchanged, List<SkippedRow> skippedUnits, List<String> conflicts, List<String> discontinued,
			List<InventoryRef> splitPeriods, List<MovedInventory> moved) {

		/**
		 * A row the registry cannot convert, carried back by its publication row
		 * identifier and the unit that stopped it, so the caller can say which
		 * rows the edition could not deliver and why.
		 */
		public record SkippedRow(String code, String unit) {
		}

		/**
		 * An open draft inventory whose period the applies-from date falls
		 * inside. One reporting year calculated on two editions breaks the
		 * consistency principle of chapter 1, so the decider is told.
		 */
		public record InventoryRef(UUID inventoryId, String name) {
		}

		/**
		 * A draft inventory whose classifications the import moved to the
		 * versions it cut (spec 02.6 rule 7), with how many moved.
		 */
		public record MovedInventory(UUID inventoryId, String name, int assignments) {
		}
	}

	private final OrganizationRepository organizations;

	private final EmissionFactorRepository emissionFactors;

	private final InventoryRepository inventories;

	private final InventoryAssignmentRepository assignments;

	private final UpstreamRuleRepository upstreamRules;

	private final GhgAuditEventRepository auditEvents;

	private final FactorPackEditionRepository editions;

	private final FactorPacks factorPacks;

	private final UnitConverter units;

	private final GhgAccess access;

	private final EntityManager entityManager;

	FactorPackImportService(OrganizationRepository organizations, EmissionFactorRepository emissionFactors,
			InventoryRepository inventories, InventoryAssignmentRepository assignments,
			UpstreamRuleRepository upstreamRules, GhgAuditEventRepository auditEvents,
			FactorPackEditionRepository editions, FactorPacks factorPacks, UnitConverter units, GhgAccess access,
			EntityManager entityManager) {
		this.organizations = organizations;
		this.emissionFactors = emissionFactors;
		this.inventories = inventories;
		this.assignments = assignments;
		this.upstreamRules = upstreamRules;
		this.auditEvents = auditEvents;
		this.editions = editions;
		this.factorPacks = factorPacks;
		this.units = units;
		this.access = access;
		this.entityManager = entityManager;
	}

	/**
	 * Imports a published edition by its identifier. A superseded or withdrawn
	 * edition stays readable so a past import can be explained, but nothing new
	 * is built from it, so naming one here is a 404 (spec 02.5).
	 */
	public ImportResult importPack(UUID organizationId, String editionId) {
		return importPack(organizationId,
				factorPacks.findImportable(editionId).orElseThrow(() -> GhgNotFoundException.pack(editionId)));
	}

	/** The import itself, over an edition already resolved. */
	public ImportResult importPack(UUID organizationId, FactorPacks.Pack pack) {
		var organization = organizations.findById(organizationId)
			.orElseThrow(() -> GhgNotFoundException.organization(organizationId));
		access.checkWrite(organization);
		var editionId = pack.id();
		var appliesFrom = pack.appliesFrom();
		if (appliesFrom == null) {
			// spec 02.5 refuses to publish an edition without one, so this is a draft or a hand-built pack
			throw new GhgRuleViolationException("'" + editionId + "' has no applies-from date, so there is no vintage "
					+ "for the versions an import would cut. Publish the edition with a date first.");
		}
		refuseWhileAPeriodIsLocked(organizationId, editionId, appliesFrom);

		// every version of every lineage the organization holds, by code, newest last
		var lineages = new LinkedHashMap<String, List<EmissionFactor>>();
		for (var factor : emissionFactors.findAllByOrganizationIdAndPackCodeIsNotNull(organizationId)) {
			lineages.computeIfAbsent(factor.getPackCode(), key -> new ArrayList<>()).add(factor);
		}

		// the counters and the lists live outside the persistence context, so a flush never walks them
		int created = 0;
		int versioned = 0;
		int tagged = 0;
		int unchanged = 0;
		var skippedUnits = new ArrayList<ImportResult.SkippedRow>();
		var conflicts = new ArrayList<String>();
		var delivered = new LinkedHashSet<String>();
		// every earlier version a cut superseded, keyed by its id, to the version that replaced it
		var replaced = new LinkedHashMap<UUID, EmissionFactor>();
		int applied = 0;

		for (var row : pack.factors()) {
			if (!delivered.add(row.code())) {
				// a published edition cannot hold the same code twice (spec 02.5); a hand-built pack might
				continue;
			}
			if (units.dimensionOf(row.unit()).isEmpty()) {
				// spec 02.6: a unit the registry cannot convert is reported, never dropped in silence
				skippedUnits.add(new ImportResult.SkippedRow(row.code(), row.unit()));
				continue;
			}
			var values = valuesOf(row, pack);
			var incumbent = liveVersionOf(lineages.get(row.code()));

			if (incumbent == null) {
				var version = write(organizationId, row, pack, values, appliesFrom, null, row.approved());
				lineages.computeIfAbsent(row.code(), key -> new ArrayList<>()).add(version);
				created++;
			}
			else if (incumbent.isLocallyEdited()) {
				// spec 02.6 rule 4: the organization's own correction outranks the table until a person resolves it
				conflicts.add(row.code());
				continue;
			}
			else if (editionId.equals(incumbent.getSourceEdition())) {
				// spec 02.6 rule 5: re-importing the same edition ensures the tag and changes nothing else
				incumbent.addPack(editionId);
				unchanged++;
			}
			else if (incumbent.sameValuesAs(row.name(), row.defaultScope(), row.defaultCategory(), row.scopeAgnostic(),
					row.unit(), row.kgCo2ePerUnit(), values.gases(), values.blendComposition(), values.blendGwpSource(),
					values.provenance(appliesFrom, incumbent.getValidTo()), row.basis(), row.sourceCategory(),
					row.sourceActivity(), row.sourceDetail())) {
				// spec 02.6 rule 6: another edition delivered the same values, so there is nothing to distinguish
				incumbent.addPack(editionId);
				incumbent.setSourceEdition(editionId);
				tagged++;
			}
			else {
				var version = cutAVersion(organizationId, row, pack, values, appliesFrom, incumbent, lineages);
				if (version != null) {
					// every earlier version of the lineage now points at the one the cut wrote
					for (var earlier : lineages.get(row.code())) {
						if (earlier != version) {
							replaced.put(earlier.getId(), version);
						}
					}
				}
				versioned++;
			}

			if (++applied % BATCH == 0) {
				entityManager.flush();
			}
		}
		entityManager.flush();

		var moved = replaced.isEmpty() ? List.<ImportResult.MovedInventory>of()
				: moveOpenDrafts(organizationId, editionId, appliesFrom, replaced);
		return new ImportResult(editionId, appliesFrom, created, versioned, tagged, unchanged, List.copyOf(skippedUnits),
				List.copyOf(conflicts), discontinued(editionId, delivered, lineages),
				versioned == 0 ? List.of() : splitPeriods(organizationId, appliesFrom), moved);
	}

	/**
	 * Spec 02.6 rule 7, the other half. A version cut is worth nothing to a
	 * draft that keeps pointing at the version it superseded, so the open
	 * drafts the edition applies to are moved to the versions it cut: every
	 * classification in a draft whose whole period lies on or after the
	 * applies-from date, and, in a draft the date splits, every classification
	 * whose record starts on or after it, so the run discloses both editions.
	 * The same goes for the upstream rules that ride on those factors.
	 *
	 * <p>Only approved versions are moved to: an unapproved edition row is a
	 * template until someone checks it (spec 02.11), and the coverage warning
	 * says so meanwhile. Locked inventories keep the factors they reported
	 * with, and earlier periods keep their vintage. Each draft that moved
	 * records the act in its history beside the adoption.
	 */
	private List<ImportResult.MovedInventory> moveOpenDrafts(UUID organizationId, String editionId,
			LocalDate appliesFrom, Map<UUID, EmissionFactor> replaced) {
		var moved = new ArrayList<ImportResult.MovedInventory>();
		for (var inventory : inventories.findAllByOrganizationIdAndStatusOrderByPeriodStartAsc(organizationId,
				InventoryStatus.DRAFT)) {
			if (inventory.getPeriodEnd().isBefore(appliesFrom)) {
				continue;
			}
			var wholePeriod = !inventory.getPeriodStart().isBefore(appliesFrom);
			int count = 0;
			for (var assignment : assignments.findAllByInventoryIdOrderByCreatedAtAsc(inventory.getId())) {
				var factor = assignment.getEmissionFactor();
				var version = factor == null ? null : replaced.get(factor.getId());
				if (version == null || !version.isApproved()) {
					continue;
				}
				if (wholePeriod || !assignment.getActivity().getPeriodStart().isBefore(appliesFrom)) {
					assignment.repoint(version);
					count++;
				}
			}
			for (var rule : upstreamRules.findAllByInventoryIdOrderByCreatedAtAsc(inventory.getId())) {
				var primary = replaced.get(rule.getPrimaryFactor().getId());
				var upstream = replaced.get(rule.getUpstreamFactor().getId());
				if ((primary != null && primary.isApproved()) || (upstream != null && upstream.isApproved())) {
					rule.repoint(primary != null && primary.isApproved() ? primary : null,
							upstream != null && upstream.isApproved() ? upstream : null);
				}
			}
			if (count > 0) {
				auditEvents.save(new GhgAuditEvent(inventory, null, GhgAuditEvent.Action.REVIEWED,
						access.currentUserId(), access.currentUserEmail(),
						access.attributed(inventory.getOrganization(), count + " classification"
								+ (count == 1 ? "" : "s") + " moved to '" + editionId + "' from " + appliesFrom)));
				moved.add(new ImportResult.MovedInventory(inventory.getId(), inventory.getName(), count));
			}
		}
		return List.copyOf(moved);
	}

	/**
	 * Spec 02.6 rule 7. The incumbent is closed the day before the edition
	 * applies and a new version carries the edition's values from that day.
	 * Approval carries forward from the incumbent; an edition row that is itself
	 * unapproved produces an unapproved version whatever the incumbent said.
	 *
	 * <p>Two editions that apply from the same day describe one vintage, and an
	 * erratum is exactly that (spec 02.5). There is no room to cut a version
	 * between them and the unique index would refuse a second version with the
	 * same start, so the correction replaces the values of that vintage in
	 * place. The lineage keeps one version per vintage either way.
	 */
	private EmissionFactor cutAVersion(UUID organizationId, FactorPacks.PackFactor row, FactorPacks.Pack pack,
			Values values, LocalDate appliesFrom, EmissionFactor incumbent, Map<String, List<EmissionFactor>> lineages) {
		var approved = row.approved() && incumbent.isApproved();
		if (appliesFrom.equals(incumbent.getValidFrom())) {
			incumbent.update(row.name(), row.defaultScope(), row.defaultCategory(), row.scopeAgnostic(), row.unit(),
					row.kgCo2ePerUnit(), values.gases(), values.blendComposition(), values.blendGwpSource(),
					values.provenance(appliesFrom, incumbent.getValidTo()), approved);
			incumbent.addPack(pack.id());
			stamp(incumbent, row, pack.id());
			// the same row, corrected in place: nothing points anywhere new
			return null;
		}
		incumbent.closeAt(appliesFrom.minusDays(1));
		var version = write(organizationId, row, pack, values, appliesFrom, incumbent, approved);
		incumbent.supersededBy(version);
		lineages.computeIfAbsent(row.code(), key -> new ArrayList<>()).add(version);
		return version;
	}

	/** A new version of a lineage, carrying the incumbent's pack tags forward when there is one. */
	private EmissionFactor write(UUID organizationId, FactorPacks.PackFactor row, FactorPacks.Pack pack, Values values,
			LocalDate appliesFrom, EmissionFactor incumbent, boolean approved) {
		var version = new EmissionFactor(organizationId, row.name(), row.defaultScope(), row.defaultCategory(),
				row.scopeAgnostic(), row.unit(), row.kgCo2ePerUnit(), values.gases(), values.blendComposition(),
				values.blendGwpSource(), values.provenance(appliesFrom, null), approved, pack.id(), row.code());
		if (incumbent != null) {
			incumbent.getPacks().forEach(version::addPack);
		}
		version.addPack(pack.id());
		stamp(version, row, pack.id());
		// persist, never save: a version carries an assigned identifier, so save() would treat it as
		// detached and read the row back before every insert. Importing 1,868 rows makes that 1,868
		// needless round trips, which is the difference between four seconds and a minute.
		entityManager.persist(version);
		return version;
	}

	/** What a version records about where it came from, apart from its values. */
	private static void stamp(EmissionFactor version, FactorPacks.PackFactor row, String editionId) {
		version.setSourceEdition(editionId);
		version.setGridRegion(gridRegionOf(row.code()));
		version.setReportingBasis(row.basis());
		// spec 02.5: the publisher's taxonomy travels with the row, so the picker can tell two factors
		// of the same display name apart and filter on it (FU-03)
		version.setTaxonomy(row.sourceCategory(), row.sourceActivity(), row.sourceDetail());
	}

	/**
	 * Spec 02.6 rule 1. A reported period keeps the factors it reported with, so
	 * an applies-from date inside a FROZEN, FINAL or PUBLISHED period refuses the
	 * whole import and writes nothing.
	 */
	private void refuseWhileAPeriodIsLocked(UUID organizationId, String editionId, LocalDate appliesFrom) {
		for (var inventory : inventories.findAllByOrganizationIdAndStatusInOrderByPeriodStartAsc(organizationId,
				LOCKED)) {
			if (!appliesFrom.isBefore(inventory.getPeriodStart()) && !appliesFrom.isAfter(inventory.getPeriodEnd())) {
				throw new GhgRuleViolationException("'" + editionId + "' applies from " + appliesFrom
						+ ", which falls inside '" + inventory.getName() + "' (" + inventory.getPeriodStart() + " to "
						+ inventory.getPeriodEnd() + "), which is " + inventory.getStatus()
						+ ". A reported period keeps the factors it reported with. Reopen that inventory, or import "
						+ "the edition into a later period.");
			}
		}
	}

	/**
	 * Spec 02.6 rule 7. Where the applies-from date falls inside the period of
	 * an open draft inventory, that inventory is carried back: one reporting
	 * year calculated on two editions breaks the consistency principle of
	 * chapter 1, and the decider is told before accepting.
	 */
	private List<ImportResult.InventoryRef> splitPeriods(UUID organizationId, LocalDate appliesFrom) {
		return inventories.findAllByOrganizationIdAndStatusOrderByPeriodStartAsc(organizationId, InventoryStatus.DRAFT)
			.stream()
			.filter(inventory -> !appliesFrom.isBefore(inventory.getPeriodStart())
					&& !appliesFrom.isAfter(inventory.getPeriodEnd()))
			// the first day of a period is not a split: the whole period is on the new edition
			.filter(inventory -> !appliesFrom.equals(inventory.getPeriodStart()))
			.map(inventory -> new ImportResult.InventoryRef(inventory.getId(), inventory.getName()))
			.toList();
	}

	/**
	 * The lineages the organization holds from this family that the edition
	 * dropped (spec 02.6). Nothing is retired: a publisher dropping a row is a
	 * decision for the organization, and a silent retirement would move a number
	 * without anyone saying so.
	 */
	private List<String> discontinued(String editionId, Set<String> delivered,
			Map<String, List<EmissionFactor>> lineages) {
		var family = editions.findById(editionId)
			.map(edition -> Set.copyOf(editions.findAllByPackKeyOrderByEditionIdAsc(edition.getPackKey())
				.stream()
				.map(FactorPackEdition::getEditionId)
				.toList()))
			.orElse(Set.of(editionId));
		var dropped = new ArrayList<String>();
		for (var entry : lineages.entrySet()) {
			if (delivered.contains(entry.getKey())) {
				continue;
			}
			var live = liveVersionOf(entry.getValue());
			if (live == null) {
				continue;
			}
			var held = live.getSourceEdition() != null && family.contains(live.getSourceEdition())
					|| live.getPacks().stream().anyMatch(family::contains);
			if (held) {
				dropped.add(entry.getKey());
			}
		}
		return dropped.stream().sorted().toList();
	}

	/**
	 * The live version of a lineage: the one nothing has replaced, and of those
	 * the latest to start. A version with no start has always applied, so it
	 * sorts first.
	 */
	static EmissionFactor liveVersionOf(List<EmissionFactor> versions) {
		if (versions == null || versions.isEmpty()) {
			return null;
		}
		var byStart = Comparator.comparing(EmissionFactor::getValidFrom,
				Comparator.nullsFirst(Comparator.naturalOrder()));
		return versions.stream()
			.filter(EmissionFactor::isLive)
			.max(byStart)
			.orElseGet(() -> versions.stream().max(byStart).orElse(null));
	}

	/** The values an edition row states, computed once per row. */
	private record Values(EmissionFactor.Gases gases, String blendComposition, String blendGwpSource, String citation,
			String citationUrl, Integer citationYear, Integer dataYear, String notes) {

		EmissionFactor.Provenance provenance(LocalDate validFrom, LocalDate validTo) {
			return new EmissionFactor.Provenance(citation, citationUrl, citationYear, dataYear, validFrom, validTo,
					notes);
		}
	}

	private static Values valuesOf(FactorPacks.PackFactor row, FactorPacks.Pack pack) {
		var gases = new EmissionFactor.Gases(nz(row.co2()), nz(row.ch4()), row.ch4Fossil(), nz(row.n2o()),
				nz(row.hfcsKg()), nz(row.pfcsKg()), nz(row.sf6()), nz(row.nf3()), nz(row.biogenicCo2()));
		// spec 02.3: the row cites the publication it comes from, not the pack that delivered it
		var citation = row.citation(pack);
		// spec 02.6: the truncation is a backstop on the column's width. V45 widened it so no published
		// edition relies on it, and spec 02.5 rule 2 refuses to publish a row whose citation would not fit.
		var fitted = citation.length() > FactorPackValidation.MAX_CITATION_LENGTH
				? citation.substring(0, FactorPackValidation.MAX_CITATION_LENGTH - 3) + "..." : citation;
		return new Values(gases, trimToNull(row.blendComposition()), trimToNull(row.blendGwpSource()), fitted,
				row.citationUrl(pack), row.citationYear(pack), row.dataYear(), trimToNull(row.notes()));
	}

	/**
	 * The grid a pack row serves (spec 03.4): a national grid row names its country in the third
	 * segment and eGRID rows the subregion. The shape is the publisher's prefix then {@code grid},
	 * so {@code EMBER:grid:GHA:2024} and {@code GHANA:grid:GHA:2024} both read GHA. Keying on the
	 * segment rather than on one publisher's prefix is what kept the suggestion alive when spec
	 * 02.9 narrowed the catalogue and the Ember pack left.
	 */
	static String gridRegionOf(String code) {
		if (code == null) {
			return null;
		}
		var parts = code.split(":");
		if (parts.length >= 3 && "grid".equals(parts[1])) {
			return parts[2];
		}
		if (code.startsWith("EPA:Electricity_US_eGRID_subregion") && parts.length >= 3) {
			return "US-" + parts[2].split("_")[0];
		}
		return null;
	}

	private static BigDecimal nz(BigDecimal value) {
		return value == null ? BigDecimal.ZERO : value;
	}

	private static String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		var trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
