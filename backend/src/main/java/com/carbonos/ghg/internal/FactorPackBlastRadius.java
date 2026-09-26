package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * What publishing or withdrawing an edition would do (spec 02.5), read before
 * either act. Publication itself changes no organization's data: spec 02.7
 * governs adoption, and this report is what a maintainer weighs before raising
 * that decision for every holder at once.
 *
 * <p>It keys on the row's code, never on a pack tag, because 150 codes appear
 * in more than one pack file and a holder may carry a row under a sector pack's
 * tag. A lineage is the publication row identifier, so a holder is found
 * whatever pack delivered it.
 *
 * <p>Every figure in it is an estimate and says so: the tonnage is computed from
 * the organization's last completed run, whose activity data can change before
 * the next one.
 */
@Component
public class FactorPackBlastRadius {

	/** More than this much movement on a row is what the report calls out (spec 02.5). */
	public static final BigDecimal THRESHOLD_PERCENT = new BigDecimal("5");

	/** The state change the report is read before. */
	public enum Act {
		PUBLISH, WITHDRAW
	}

	private static final MathContext MC = MathContext.DECIMAL64;

	/** The inventories whose period is no longer the organization's to change (specs 05.1 and 02.7). */
	private static final List<InventoryStatus> LOCKED = List.of(InventoryStatus.FROZEN, InventoryStatus.FINAL,
			InventoryStatus.PUBLISHED);

	/**
	 * One lineage as the edition would move it: the predecessor's value, this
	 * edition's, and how many organizations hold it.
	 */
	public record RowChange(String code, String name, String unit, FactorPackChange.Kind kind, BigDecimal oldKgCo2e,
			BigDecimal newKgCo2e, BigDecimal absoluteChange, BigDecimal percentChange, boolean overThreshold,
			boolean approved, long holders) {
	}

	/** One inventory the report names: a draft that would move, or a locked period that blocks a lineage. */
	public record InventoryRef(UUID inventoryId, String name, String periodStart, String periodEnd,
			InventoryStatus status) {
	}

	/** What one organization would see, keyed on the lineages it actually holds. */
	public record OrganizationImpact(UUID organizationId, String organizationName, Long organizationAccountNo,
			int lineagesHeld, int rowsMoving,
			int rowsOverThreshold, BigDecimal estimatedKgCo2eDelta, String lastRunLabel, List<InventoryRef> openDrafts,
			List<InventoryRef> lockedPeriods, List<String> conflicts, List<String> blocked, List<String> unapproved,
			List<String> discontinued, String diffHash) {
	}

	/**
	 * The whole report. For a withdrawal the row list is empty and the
	 * organizations are the ones whose open notices would close and the holders
	 * already carrying the edition.
	 */
	public record Report(String editionId, String packKey, Act act, String predecessorEditionId, int rowsAdded,
			int rowsChanged, int rowsDiscontinued, int rowsUnchanged, int rowsOverThreshold, List<RowChange> rows,
			List<String> discontinuedLineages, List<String> unapprovedRows, List<OrganizationImpact> organizations,
			long holderCount, long openNoticeCount) {
	}

	private final FactorPackEditionRepository editions;
	private final FactorPackRowRepository rows;
	private final EmissionFactorRepository emissionFactors;
	private final OrganizationRepository organizations;
	private final InventoryRepository inventories;
	private final InventoryAssignmentRepository assignments;
	private final GhgRunRepository runs;
	private final FactorPackNoticeRepository notices;

	FactorPackBlastRadius(FactorPackEditionRepository editions, FactorPackRowRepository rows,
			EmissionFactorRepository emissionFactors, OrganizationRepository organizations,
			InventoryRepository inventories, InventoryAssignmentRepository assignments, GhgRunRepository runs,
			FactorPackNoticeRepository notices) {
		this.editions = editions;
		this.rows = rows;
		this.emissionFactors = emissionFactors;
		this.organizations = organizations;
		this.inventories = inventories;
		this.assignments = assignments;
		this.runs = runs;
		this.notices = notices;
	}

	/**
	 * The edition the change log is computed against: the family's latest
	 * vintage other than this one that still stands and does not apply after
	 * it. That is the published or superseded edition with the latest
	 * applies-from date no later than this edition's own and, between two that
	 * apply from the same day, the one published last. An earlier vintage
	 * published late, such as a 2025 table seeded after the 2026 one, is not
	 * the predecessor of a 2027 draft, and the 2026 edition is not the
	 * predecessor of that 2025 table: an edition succeeds only what came before
	 * it. A withdrawn edition is never the predecessor: the publisher retracted
	 * it, so a draft that clones what came before it is diffed against that
	 * edition and not against the retraction. A family's first edition, and an
	 * earlier vintage arriving late, has none, so every row of it is an
	 * addition and nothing moves for anybody.
	 */
	@Transactional(readOnly = true)
	public FactorPackEdition predecessorOf(FactorPackEdition edition) {
		return editions.findAllByPackKeyOrderByEditionIdAsc(edition.getPackKey())
			.stream()
			.filter(candidate -> !candidate.getEditionId().equals(edition.getEditionId()))
			.filter(candidate -> candidate.getStatus() == FactorPackStatus.PUBLISHED
					|| candidate.getStatus() == FactorPackStatus.SUPERSEDED)
			.filter(candidate -> edition.getAppliesFrom() == null || candidate.getAppliesFrom() == null
					|| !candidate.getAppliesFrom().isAfter(edition.getAppliesFrom()))
			.max(Comparator
				.comparing((FactorPackEdition candidate) -> candidate.getAppliesFrom() == null ? LocalDate.MIN
						: candidate.getAppliesFrom())
				.thenComparing(candidate -> candidate.getPublishedAt() == null ? java.time.Instant.EPOCH
						: candidate.getPublishedAt())
				.thenComparing(FactorPackEdition::getEditionId))
			.orElse(null);
	}

	/** The report a maintainer reads before publishing. */
	@Transactional(readOnly = true)
	public Report forPublication(FactorPackEdition edition) {
		var predecessor = predecessorOf(edition);
		var newRows = rows.findAllByEditionIdOrderByOrdinalAsc(edition.getEditionId());
		var oldRows = predecessor == null ? List.<FactorPackRow>of()
				: rows.findAllByEditionIdOrderByOrdinalAsc(predecessor.getEditionId());
		return report(edition, predecessor, Act.PUBLISH, changes(newRows, oldRows), newRows);
	}

	/**
	 * The report a maintainer reads before withdrawing, and the one the console
	 * shows for any edition that is no longer a draft: the organizations whose
	 * open notices would close and the holders already carrying the edition. The
	 * rows they hold stay exactly as they are, so no organization impact in it
	 * carries movement, an estimate or a locked period; each names how many
	 * lineages the organization holds, counted once per lineage whatever the
	 * number of versions.
	 */
	@Transactional(readOnly = true)
	public Report forWithdrawal(FactorPackEdition edition) {
		var held = rows.findAllByEditionIdOrderByOrdinalAsc(edition.getEditionId());
		var codes = held.stream().map(FactorPackRow::getCode).collect(java.util.stream.Collectors.toSet());
		var holders = codes.isEmpty() ? List.<EmissionFactor>of() : emissionFactors.heldByCode(codes);
		var open = notices.findAllByEditionIdAndStatus(edition.getEditionId(), FactorPackNotice.Status.OPEN);
		var affected = new LinkedHashSet<UUID>();
		open.forEach(notice -> affected.add(notice.getOrganizationId()));
		holders.forEach(factor -> affected.add(factor.getOrganizationId()));
		var byOrganization = new LinkedHashMap<UUID, List<EmissionFactor>>();
		for (var factor : holders) {
			byOrganization.computeIfAbsent(factor.getOrganizationId(), key -> new ArrayList<>()).add(factor);
		}
		var names = organizationNames(affected);
		var impacts = new ArrayList<OrganizationImpact>();
		for (var organizationId : affected) {
			var theirs = byOrganization.getOrDefault(organizationId, List.of());
			var organization = names.get(organizationId);
			impacts.add(new OrganizationImpact(organizationId,
					organization == null ? "an organization" : organization.getName(),
					organization == null ? null : organization.getAccountNo(), liveByCode(theirs).size(), 0, 0,
					BigDecimal.ZERO, null, openDrafts(organizationId), List.of(),
					List.of(), List.of(), List.of(), List.of(), null));
		}
		return new Report(edition.getEditionId(), edition.getPackKey(), Act.WITHDRAW, edition.getSupersedesId(), 0, 0,
				0, 0, 0, List.of(), List.of(), List.of(), List.copyOf(impacts),
				byOrganization.keySet().stream().count(), open.size());
	}

	// --- the change log -----------------------------------------------------

	/**
	 * The comparison between two editions, row by row and keyed on the code:
	 * added, changed, discontinued, unchanged, with the percent change. This is
	 * what publication freezes into {@code ghg_factor_pack_changes}.
	 */
	List<FactorPackChange> changes(List<FactorPackRow> newRows, List<FactorPackRow> oldRows) {
		var before = new LinkedHashMap<String, FactorPackRow>();
		oldRows.forEach(row -> before.put(row.getCode(), row));
		var log = new ArrayList<FactorPackChange>();
		var seen = new LinkedHashSet<String>();
		for (var row : newRows) {
			if (!seen.add(row.getCode())) {
				continue;
			}
			var previous = before.get(row.getCode());
			if (previous == null) {
				log.add(new FactorPackChange(row.getEditionId(), row.getCode(), FactorPackChange.Kind.ADDED, null,
						row.getKgCo2ePerUnit(), null));
				continue;
			}
			var moved = fieldsThatMoved(previous, row);
			log.add(new FactorPackChange(row.getEditionId(), row.getCode(),
					moved.isEmpty() ? FactorPackChange.Kind.UNCHANGED : FactorPackChange.Kind.CHANGED,
					previous.getKgCo2ePerUnit(), row.getKgCo2ePerUnit(), String.join(", ", moved)));
		}
		for (var previous : before.values()) {
			if (!seen.contains(previous.getCode())) {
				log.add(new FactorPackChange(
						newRows.isEmpty() ? previous.getEditionId() : newRows.getFirst().getEditionId(),
						previous.getCode(), FactorPackChange.Kind.DISCONTINUED, previous.getKgCo2ePerUnit(), null,
						null));
			}
		}
		return log;
	}

	/** What moved between two versions of one lineage, in the words the change log prints. */
	private static List<String> fieldsThatMoved(FactorPackRow before, FactorPackRow after) {
		var moved = new ArrayList<String>();
		if (differs(before.getKgCo2ePerUnit(), after.getKgCo2ePerUnit())) {
			moved.add("kg CO2e per unit");
		}
		if (!java.util.Objects.equals(before.getUnit(), after.getUnit())) {
			moved.add("unit");
		}
		if (!java.util.Objects.equals(before.getName(), after.getName())) {
			moved.add("name");
		}
		var beforeFacts = before.facts();
		var afterFacts = after.facts();
		if (differs(beforeFacts.co2(), afterFacts.co2()) || differs(beforeFacts.ch4(), afterFacts.ch4())
				|| differs(beforeFacts.n2o(), afterFacts.n2o()) || differs(beforeFacts.hfcsKg(), afterFacts.hfcsKg())
				|| differs(beforeFacts.pfcsKg(), afterFacts.pfcsKg()) || differs(beforeFacts.sf6(), afterFacts.sf6())
				|| differs(beforeFacts.nf3(), afterFacts.nf3())) {
			moved.add("gas split");
		}
		if (differs(before.getBiogenicCo2KgPerUnit(), after.getBiogenicCo2KgPerUnit())) {
			moved.add("biogenic CO2");
		}
		if (!java.util.Objects.equals(before.getSourcePublication(), after.getSourcePublication())
				|| !java.util.Objects.equals(before.getPublicationYear(), after.getPublicationYear())
				|| !java.util.Objects.equals(before.getDataYear(), after.getDataYear())) {
			moved.add("provenance");
		}
		if (before.isApproved() != after.isApproved()) {
			moved.add("approval");
		}
		if (before.getDefaultScope() != after.getDefaultScope()
				|| before.getDefaultCategory() != after.getDefaultCategory()) {
			moved.add("scope or category");
		}
		return moved;
	}

	private static boolean differs(BigDecimal left, BigDecimal right) {
		if (left == null || right == null) {
			return left != right;
		}
		return left.compareTo(right) != 0;
	}

	// --- the report ---------------------------------------------------------

	private Report report(FactorPackEdition edition, FactorPackEdition predecessor, Act act,
			List<FactorPackChange> log, List<FactorPackRow> newRows) {
		var rowsByCode = new LinkedHashMap<String, FactorPackRow>();
		newRows.forEach(row -> rowsByCode.put(row.getCode(), row));
		var moving = log.stream()
			.filter(change -> change.getKind() != FactorPackChange.Kind.UNCHANGED)
			.map(FactorPackChange::getCode)
			.collect(java.util.stream.Collectors.toSet());
		var codes = log.stream().map(FactorPackChange::getCode).collect(java.util.stream.Collectors.toSet());
		var held = codes.isEmpty() ? List.<EmissionFactor>of() : emissionFactors.heldByCode(codes);

		var holdersByCode = new LinkedHashMap<String, Set<UUID>>();
		var byOrganization = new LinkedHashMap<UUID, List<EmissionFactor>>();
		for (var factor : held) {
			holdersByCode.computeIfAbsent(factor.getPackCode(), key -> new LinkedHashSet<>())
				.add(factor.getOrganizationId());
			byOrganization.computeIfAbsent(factor.getOrganizationId(), key -> new ArrayList<>()).add(factor);
		}

		var rowChanges = new ArrayList<RowChange>();
		for (var change : log) {
			var row = rowsByCode.get(change.getCode());
			var absolute = change.getOldKgCo2e() == null || change.getNewKgCo2e() == null ? null
					: change.getNewKgCo2e().subtract(change.getOldKgCo2e());
			rowChanges.add(new RowChange(change.getCode(), row == null ? change.getCode() : row.getName(),
					row == null ? null : row.getUnit(), change.getKind(), change.getOldKgCo2e(),
					change.getNewKgCo2e(), absolute, change.getPercentChange(), overThreshold(change.getPercentChange()),
					row != null && row.isApproved(), holdersByCode.getOrDefault(change.getCode(), Set.of()).size()));
		}

		var impacts = new ArrayList<OrganizationImpact>();
		var names = organizationNames(byOrganization.keySet());
		for (var entry : byOrganization.entrySet()) {
			impacts.add(impactOf(entry.getKey(), names.get(entry.getKey()), entry.getValue(), log, rowsByCode,
					moving));
		}
		// spec 01.8: two holders of one name sort apart by account number
		impacts.sort(Comparator.comparing(OrganizationImpact::organizationName,
				Comparator.nullsLast(String::compareToIgnoreCase))
			.thenComparing(OrganizationImpact::organizationAccountNo,
					Comparator.nullsLast(Comparator.naturalOrder())));

		var discontinued = log.stream()
			.filter(change -> change.getKind() == FactorPackChange.Kind.DISCONTINUED)
			.map(FactorPackChange::getCode)
			.sorted()
			.toList();
		var unapproved = newRows.stream()
			.filter(row -> !row.isApproved())
			.map(FactorPackRow::getCode)
			.sorted()
			.toList();
		return new Report(edition.getEditionId(), edition.getPackKey(), act,
				predecessor == null ? null : predecessor.getEditionId(),
				count(log, FactorPackChange.Kind.ADDED), count(log, FactorPackChange.Kind.CHANGED),
				count(log, FactorPackChange.Kind.DISCONTINUED), count(log, FactorPackChange.Kind.UNCHANGED),
				(int) rowChanges.stream().filter(RowChange::overThreshold).count(), List.copyOf(rowChanges),
				discontinued, unapproved, List.copyOf(impacts), byOrganization.size(),
				notices.countByEditionIdAndStatus(edition.getEditionId(), FactorPackNotice.Status.OPEN));
	}

	/**
	 * What one organization would see. The current value is the one it holds,
	 * not the predecessor's, because a locally edited row has already moved away
	 * from the published table and is what the estimate must weigh.
	 */
	private OrganizationImpact impactOf(UUID organizationId, Organization organization, List<EmissionFactor> theirs,
			List<FactorPackChange> log, Map<String, FactorPackRow> rowsByCode, Set<String> moving) {
		var byCode = liveByCode(theirs);
		var lockedFactorIds = assignments.factorIdsInInventoriesWithStatus(organizationId, LOCKED);

		var conflicts = new ArrayList<String>();
		var blocked = new ArrayList<String>();
		var unapproved = new ArrayList<String>();
		var discontinued = new ArrayList<String>();
		var comparison = new TreeMap<String, String>();
		var rowsMoving = 0;
		var rowsOverThreshold = 0;
		for (var change : log) {
			var factor = byCode.get(change.getCode());
			if (factor == null) {
				continue;
			}
			if (change.getKind() == FactorPackChange.Kind.DISCONTINUED) {
				discontinued.add(change.getCode());
				comparison.put(change.getCode(), plain(factor.getKgCo2ePerUnit()) + "|discontinued");
				continue;
			}
			var proposed = rowsByCode.get(change.getCode());
			if (proposed == null) {
				continue;
			}
			comparison.put(change.getCode(), plain(factor.getKgCo2ePerUnit()) + "|" + plain(proposed.getKgCo2ePerUnit()));
			if (!proposed.isApproved()) {
				unapproved.add(change.getCode());
			}
			if (factor.isLocallyEdited()) {
				conflicts.add(change.getCode());
			}
			if (lockedFactorIds.contains(factor.getId())) {
				blocked.add(change.getCode());
			}
			var percent = FactorPackChange.percentChange(factor.getKgCo2ePerUnit(), proposed.getKgCo2ePerUnit());
			if (percent != null && percent.signum() != 0 || moving.contains(change.getCode())) {
				rowsMoving++;
			}
			if (overThreshold(percent)) {
				rowsOverThreshold++;
			}
		}

		var lastRun = runs.completedRuns(organizationId, PageRequest.of(0, 1)).stream().findFirst().orElse(null);
		var delta = estimatedDeltaOf(organizationId, theirs, rowsByCode);
		return new OrganizationImpact(organizationId, organization == null ? "an organization" : organization.getName(),
				organization == null ? null : organization.getAccountNo(), byCode.size(), rowsMoving, rowsOverThreshold,
				delta, lastRun == null ? null : lastRun.getLabel(), openDrafts(organizationId),
				lockedInventories(organizationId), List.copyOf(conflicts), List.copyOf(blocked),
				List.copyOf(unapproved), List.copyOf(discontinued), diffHash(comparison));
	}

	/**
	 * The live version of each lineage an organization holds, keyed on the code
	 * (spec 02.6). A lineage that has been versioned by an adoption carries a
	 * closed version beside the live one, and it is one lineage: the live
	 * version is what the edition would move, and what every consumer compares
	 * the proposed row against.
	 */
	static Map<String, EmissionFactor> liveByCode(List<EmissionFactor> theirs) {
		var versions = new LinkedHashMap<String, List<EmissionFactor>>();
		for (var factor : theirs) {
			if (factor.getPackCode() != null) {
				versions.computeIfAbsent(factor.getPackCode(), key -> new ArrayList<>()).add(factor);
			}
		}
		var live = new LinkedHashMap<String, EmissionFactor>();
		versions.forEach((code, lineage) -> {
			var version = FactorPackImportService.liveVersionOf(lineage);
			if (version != null) {
				live.put(code, version);
			}
		});
		return live;
	}

	/**
	 * The tonnage the edition would move for one organization, estimated from
	 * its last completed run: each line's emissions scaled by how far its factor
	 * would move, measured from the version the line was priced with. Every
	 * version the organization holds is matched, because a run over an earlier
	 * period may have been priced with a version an adoption has since closed.
	 * It is an estimate, and the activity data behind it can change before the
	 * next run. An organization that has never completed a run moves nothing
	 * that can be estimated, and reads zero.
	 */
	BigDecimal estimatedDeltaOf(UUID organizationId, List<EmissionFactor> theirs,
			Map<String, FactorPackRow> rowsByCode) {
		var run = runs.completedRuns(organizationId, PageRequest.of(0, 1)).stream().findFirst().orElse(null);
		if (run == null) {
			return BigDecimal.ZERO;
		}
		var withLines = runs.findWithLinesById(run.getId()).orElse(null);
		if (withLines == null) {
			return BigDecimal.ZERO;
		}
		var byId = new LinkedHashMap<UUID, EmissionFactor>();
		theirs.forEach(factor -> byId.put(factor.getId(), factor));
		var delta = BigDecimal.ZERO;
		for (var line : withLines.getLines()) {
			var factor = line.getFactorId() == null ? null : byId.get(line.getFactorId());
			if (factor == null || factor.getPackCode() == null) {
				continue;
			}
			var proposed = rowsByCode.get(factor.getPackCode());
			var current = factor.getKgCo2ePerUnit();
			if (proposed == null || current == null || current.signum() == 0) {
				continue;
			}
			var ratio = proposed.getKgCo2ePerUnit().divide(current, MC).subtract(BigDecimal.ONE);
			delta = delta.add(line.getKgCo2e().multiply(ratio, MC));
		}
		return delta.setScale(3, RoundingMode.HALF_UP);
	}

	/** The organization's open drafts: the inventories a decision to adopt would move. */
	private List<InventoryRef> openDrafts(UUID organizationId) {
		return inventories.findAllByOrganizationIdAndStatusOrderByPeriodStartAsc(organizationId, InventoryStatus.DRAFT)
			.stream()
			.map(FactorPackBlastRadius::ref)
			.toList();
	}

	private List<InventoryRef> lockedInventories(UUID organizationId) {
		var found = new ArrayList<InventoryRef>();
		for (var status : LOCKED) {
			inventories.findAllByOrganizationIdAndStatusOrderByPeriodStartAsc(organizationId, status)
				.forEach(inventory -> found.add(ref(inventory)));
		}
		return List.copyOf(found);
	}

	private static InventoryRef ref(Inventory inventory) {
		return new InventoryRef(inventory.getId(), inventory.getName(), inventory.getPeriodStart().toString(),
				inventory.getPeriodEnd().toString(), inventory.getStatus());
	}

	private Map<UUID, Organization> organizationNames(java.util.Collection<UUID> ids) {
		var names = new LinkedHashMap<UUID, Organization>();
		if (ids.isEmpty()) {
			return names;
		}
		organizations.findAllById(ids).forEach(organization -> names.put(organization.getId(), organization));
		return names;
	}

	/**
	 * The hash over one organization's per-row comparison, so a verifier can
	 * confirm the diff the decider saw is the diff the record describes
	 * (spec 02.7). It is over the sorted lines, so it does not depend on the
	 * order rows happen to be read in.
	 */
	static String diffHash(Map<String, String> comparison) {
		var joined = new StringBuilder();
		comparison.forEach((code, values) -> joined.append(code).append('|').append(values).append('\n'));
		try {
			return java.util.HexFormat.of()
				.formatHex(java.security.MessageDigest.getInstance("SHA-256")
					.digest(joined.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8)));
		}
		catch (java.security.NoSuchAlgorithmException ex) {
			throw new IllegalStateException("SHA-256 is not available", ex);
		}
	}

	static boolean overThreshold(BigDecimal percent) {
		return percent != null && percent.abs().compareTo(THRESHOLD_PERCENT) > 0;
	}

	private static String plain(BigDecimal value) {
		return value == null ? "" : value.stripTrailingZeros().toPlainString();
	}

	private static int count(List<FactorPackChange> log, FactorPackChange.Kind kind) {
		return (int) log.stream().filter(change -> change.getKind() == kind).count();
	}
}
