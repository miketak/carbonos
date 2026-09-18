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
 * edition's applies-from date. An edition that applies before the live version
 * started is an earlier vintage arriving late: its version is written behind
 * the ones the organization holds, and none of them moves. Approval carries
 * forward, because approval is a decision the organization made about the
 * lineage; a row the edition itself publishes unapproved produces an
 * unapproved version.
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
	 * {@code versioned} is versions cut, ahead of the live version or behind
	 * an earlier one, {@code tagged} is rows another edition
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
		// every lineage the import cut a version into, with all its versions, for the drafts to follow
		var touched = new LinkedHashMap<String, List<EmissionFactor>>();
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
			var versions = lineages.get(row.code());
			var incumbent = liveVersionOf(versions);
			// the version the edition speaks to: the live one, unless the edition applies before it
			// started, in which case the version in force on that day, if the lineage has one (rule 8)
			var subject = incumbent == null ? null : subjectOf(versions, incumbent, appliesFrom);

			if (incumbent == null) {
				var version = write(organizationId, row, pack, values, appliesFrom, null, row.approved());
				lineages.computeIfAbsent(row.code(), key -> new ArrayList<>()).add(version);
				created++;
			}
			else if (subject == null) {
				// spec 02.6 rule 8: the edition applies before every version the lineage holds, so its
				// version fills the gap behind the earliest one and nothing the organization holds moves
				fillBehind(organizationId, row, pack, values, appliesFrom, versions);
				touched.put(row.code(), versions);
				versioned++;
			}
			else if (subject.isLocallyEdited()) {
				// spec 02.6 rule 4: the organization's own correction outranks the table until a person resolves it
				conflicts.add(row.code());
				continue;
			}
			else if (editionId.equals(subject.getSourceEdition())) {
				// spec 02.6 rule 5: re-importing the same edition ensures the tag and changes nothing else
				subject.addPack(editionId);
				unchanged++;
			}
			else if (subject.sameValuesAs(row.name(), row.defaultScope(), row.defaultCategory(), row.scopeAgnostic(),
					row.unit(), row.kgCo2ePerUnit(), values.gases(), values.blendComposition(), values.blendGwpSource(),
					values.provenance(appliesFrom, subject.getValidTo()), row.basis(), row.sourceCategory(),
					row.sourceActivity(), row.sourceDetail())) {
				// spec 02.6 rule 6: another edition delivered the same values, so there is nothing to distinguish
				subject.addPack(editionId);
				subject.setSourceEdition(editionId);
				tagged++;
			}
			else {
				var version = cutAVersion(organizationId, row, pack, values, appliesFrom, subject, versions);
				if (version != null) {
					// the lineage has a version it did not have, so the drafts it applies to follow it
					touched.put(row.code(), versions);
				}
				versioned++;
			}

			if (++applied % BATCH == 0) {
				entityManager.flush();
			}
		}
		entityManager.flush();

		var moved = touched.isEmpty() ? List.<ImportResult.MovedInventory>of()
				: moveOpenDrafts(organizationId, editionId, appliesFrom, touched);
		return new ImportResult(editionId, appliesFrom, created, versioned, tagged, unchanged, List.copyOf(skippedUnits),
				List.copyOf(conflicts), discontinued(editionId, appliesFrom, delivered, lineages),
				versioned == 0 ? List.of() : splitPeriods(organizationId, appliesFrom), moved);
	}

	/**
	 * The version an edition applying on a day speaks to (spec 02.6). An
	 * edition that applies on or after the live version started speaks to the
	 * live version, retired or not: that is the succession rules 4 to 7 describe.
	 * An edition that applies before the live version started is an earlier
	 * vintage arriving late, so it speaks to the version in force on its day,
	 * and to nothing when the lineage holds no version that early (rule 8).
	 */
	private static EmissionFactor subjectOf(List<EmissionFactor> versions, EmissionFactor live,
			LocalDate appliesFrom) {
		if (live.getValidFrom() == null || !appliesFrom.isBefore(live.getValidFrom())) {
			return live;
		}
		return versionInForce(versions, appliesFrom);
	}

	/** The version of a lineage whose validity covers a day, or null when none does. */
	static EmissionFactor versionInForce(List<EmissionFactor> versions, LocalDate day) {
		if (versions == null) {
			return null;
		}
		return versions.stream()
			.filter(version -> version.getValidFrom() == null || !version.getValidFrom().isAfter(day))
			.filter(version -> version.getValidTo() == null || !version.getValidTo().isBefore(day))
			.max(Comparator.comparing(EmissionFactor::getValidFrom, Comparator.nullsFirst(Comparator.naturalOrder())))
			.orElse(null);
	}

	/** The earliest version of a lineage that starts after a day, or null when none does. */
	private static EmissionFactor versionAfter(List<EmissionFactor> versions, LocalDate day) {
		return versions.stream()
			.filter(version -> version.getValidFrom() != null && version.getValidFrom().isAfter(day))
			.min(Comparator.comparing(EmissionFactor::getValidFrom))
			.orElse(null);
	}

	/**
	 * Spec 02.6 rule 8. The edition applies before every version the lineage
	 * holds, so its version is written behind the earliest one: it starts on
	 * the applies-from date, ends the day before that version begins, and is
	 * superseded by it. The versions the organization holds keep their dates
	 * and the live one stays live. Approval follows the version it sits
	 * behind, as it is the organization's decision about the lineage.
	 */
	private void fillBehind(UUID organizationId, FactorPacks.PackFactor row, FactorPacks.Pack pack, Values values,
			LocalDate appliesFrom, List<EmissionFactor> versions) {
		var next = versionAfter(versions, appliesFrom);
		var version = write(organizationId, row, pack, values, appliesFrom, next, row.approved() && next.isApproved());
		version.closeAt(next.getValidFrom().minusDays(1));
		version.supersededBy(next);
		versions.add(version);
	}

	/**
	 * Spec 02.6 rules 7 and 8, the other half. A version cut is worth nothing
	 * to a draft that keeps pointing at the version beside it, so the open
	 * drafts are moved to the version of each touched lineage in force on
	 * their day: for a classification, the later of the record's start and the
	 * draft's period start, so a draft whose whole period lies on or after the
	 * applies-from date moves entirely, a draft the date splits moves the
	 * records from that date, and a draft an earlier vintage fills in behind
	 * moves to that vintage; for an upstream rule, the draft's period end. The
	 * run then discloses every edition the period reached.
	 *
	 * <p>Only approved versions are moved to: an unapproved edition row is a
	 * template until someone checks it (spec 02.11), and the coverage warning
	 * says so meanwhile. Locked inventories keep the factors they reported
	 * with, and periods the edition does not reach keep their vintage. Each
	 * draft that moved records the act in its history beside the adoption.
	 */
	private List<ImportResult.MovedInventory> moveOpenDrafts(UUID organizationId, String editionId,
			LocalDate appliesFrom, Map<String, List<EmissionFactor>> touched) {
		var moved = new ArrayList<ImportResult.MovedInventory>();
		for (var inventory : inventories.findAllByOrganizationIdAndStatusOrderByPeriodStartAsc(organizationId,
				InventoryStatus.DRAFT)) {
			if (inventory.getPeriodEnd().isBefore(appliesFrom)) {
				continue;
			}
			int count = 0;
			for (var assignment : assignments.findAllByInventoryIdOrderByCreatedAtAsc(inventory.getId())) {
				var recordStart = assignment.getActivity().getPeriodStart();
				var day = recordStart.isAfter(inventory.getPeriodStart()) ? recordStart : inventory.getPeriodStart();
				var version = follow(touched, assignment.getEmissionFactor(), day);
				if (version != null) {
					assignment.repoint(version);
					count++;
				}
			}
			for (var rule : upstreamRules.findAllByInventoryIdOrderByCreatedAtAsc(inventory.getId())) {
				var primary = follow(touched, rule.getPrimaryFactor(), inventory.getPeriodEnd());
				var upstream = follow(touched, rule.getUpstreamFactor(), inventory.getPeriodEnd());
				if (primary != null || upstream != null) {
					rule.repoint(primary, upstream);
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
	 * The version of a touched lineage a pinned factor should follow on a day:
	 * the one in force that day when it is approved and is not the factor
	 * itself, else null. A factor outside every touched lineage follows nothing.
	 */
	private static EmissionFactor follow(Map<String, List<EmissionFactor>> touched, EmissionFactor factor,
			LocalDate day) {
		if (factor == null || factor.getPackCode() == null || !touched.containsKey(factor.getPackCode())) {
			return null;
		}
		var version = versionInForce(touched.get(factor.getPackCode()), day);
		if (version == null || version == factor || !version.isApproved()) {
			return null;
		}
		return version;
	}

	/**
	 * Spec 02.6 rule 7. The incumbent is closed the day before the edition
	 * applies and a new version carries the edition's values from that day.
	 * Approval carries forward from the incumbent; an edition row that is itself
	 * unapproved produces an unapproved version whatever the incumbent said.
	 * When the incumbent is an earlier version the edition speaks to (rule 8),
	 * the new version ends the day before the next version begins and is
	 * superseded by it, so the lineage stays one version per vintage in order.
	 *
	 * <p>Two editions that apply from the same day describe one vintage, and an
	 * erratum is exactly that (spec 02.5). There is no room to cut a version
	 * between them and the unique index would refuse a second version with the
	 * same start, so the correction replaces the values of that vintage in
	 * place. The lineage keeps one version per vintage either way.
	 */
	private EmissionFactor cutAVersion(UUID organizationId, FactorPacks.PackFactor row, FactorPacks.Pack pack,
			Values values, LocalDate appliesFrom, EmissionFactor incumbent, List<EmissionFactor> versions) {
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
		var next = versionAfter(versions, appliesFrom);
		incumbent.closeAt(appliesFrom.minusDays(1));
		var version = write(organizationId, row, pack, values, appliesFrom, incumbent, approved);
		if (next != null) {
			version.closeAt(next.getValidFrom().minusDays(1));
			version.supersededBy(next);
		}
		incumbent.supersededBy(version);
		versions.add(version);
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
	 * without anyone saying so. A lineage whose live version starts after the
	 * edition applies came from a later vintage, which an earlier edition
	 * cannot drop (rule 8).
	 */
	private List<String> discontinued(String editionId, LocalDate appliesFrom, Set<String> delivered,
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
			if (live == null || (live.getValidFrom() != null && live.getValidFrom().isAfter(appliesFrom))) {
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
