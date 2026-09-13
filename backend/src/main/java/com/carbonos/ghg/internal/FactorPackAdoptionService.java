package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Adopting a new edition (spec 02.7). Publishing an edition raises a notice and
 * changes nothing (spec 02.5); this is the inbox, the diff and the decision
 * that follow. An edition is the unit of vintage, and adopting one is an
 * accounting decision that belongs to the organization, not to the platform.
 *
 * <p>The decider holds {@code REVIEWER} or {@code OWNER}, the roles that already
 * designate a final run and publish (spec 01.2, 01.4). Accepting runs the
 * versioned import of spec 02.6 from the edition's applies-from date; declining
 * changes nothing and closes the notice. Either way the record keeps the
 * timestamp, both edition ids, the diff hash raised with the notice, the
 * decider's email and role, and the answer to the recalculation question.
 *
 * <p>Chapter 5 treats the three answers differently, and the significance test
 * is what separates them: a vintage progression is not a recalculation trigger
 * only while the estimated movement is below the organization's significance
 * threshold. At or above it, it is a methodology change and raises a candidate
 * exactly as a retrospective adoption does. There is no "not triggered" status
 * in the recalculation model, so the notice itself carries the answer in every
 * case and a candidate is raised only where one is warranted.
 */
@Service
@Transactional
public class FactorPackAdoptionService {

	/** The inventories whose period is no longer the organization's to change (specs 05.1, 02.6, 02.7). */
	private static final List<InventoryStatus> LOCKED = List.of(InventoryStatus.FROZEN, InventoryStatus.FINAL,
			InventoryStatus.PUBLISHED);

	private static final MathContext MC = MathContext.DECIMAL64;

	/** The warning the decision screen shows before accepting, in the officer's words (spec 02.7). */
	public static final String RECALCULATION_WARNING = "Accepting raises a base-year recalculation candidate. "
			+ "If it is above your significance threshold, inventories that report against the base year cannot be "
			+ "marked final or published until the recalculation is completed or declined.";

	/** One notice as the inbox lists it: the record, plus what the catalogue says about the edition. */
	public record NoticeView(FactorPackNotice notice, String editionName, String packKey, LocalDate appliesFrom,
			FactorPackStatus editionStatus, String withdrawalReason) {
	}

	/** One lineage the edition moves, as the diff shows it. */
	public record DiffRow(String code, String name, String unit, BigDecimal currentKgCo2ePerUnit,
			BigDecimal newKgCo2ePerUnit, BigDecimal absoluteChange, BigDecimal percentChange, List<String> gasesChanged,
			boolean provenanceChanged, boolean gwpBasisChanged, BigDecimal estimatedKgCo2eDelta) {
	}

	/** A lineage the decision does not apply to, with the reason in the words the page prints. */
	public record ApartRow(String code, String name, String reason) {
	}

	/** One inventory the diff names: a locked period, or an earlier one that will warn on coverage. */
	public record InventoryRef(UUID inventoryId, String name, LocalDate periodStart, LocalDate periodEnd,
			InventoryStatus status) {
	}

	/**
	 * What opening a notice shows. {@code rows} are the lineages the edition
	 * moves; the four groups are listed apart because the decision does not
	 * apply to them. The estimated movement is an estimate over the current
	 * draft period's recorded activity data and says so.
	 */
	public record Diff(UUID noticeId, String editionId, String editionName, String predecessorEditionId,
			LocalDate appliesFrom, FactorPackNotice.Status status, List<DiffRow> rows, List<ApartRow> conflicts,
			List<ApartRow> blocked, List<ApartRow> discontinued, List<InventoryRef> earlierPeriods,
			BigDecimal estimatedKgCo2eDelta, String diffHash, boolean gwpBasisChanged, String currentGwpBasis,
			String newGwpBasis, String estimatedOver, InventoryRef lockedPeriod, boolean hasBaseYear,
			BigDecimal thresholdPercent, BigDecimal affectedPercent) {
	}

	/** One accepted notice as the report's base-year section prints it (spec 02.7, 06.1). */
	public record EditionDecision(String editionId, String predecessorEditionId,
			FactorPackNotice.RecalculationCase recalculationCase, BigDecimal affectedPercent,
			BigDecimal thresholdPercent, java.time.Instant decidedAt, String decidedBy, String note) {
	}

	private final FactorPackNoticeRepository notices;
	private final FactorPackEditionRepository editions;
	private final FactorPackRowRepository packRows;
	private final EmissionFactorRepository emissionFactors;
	private final OrganizationRepository organizations;
	private final InventoryRepository inventories;
	private final InventoryAssignmentRepository assignments;
	private final GhgAuditEventRepository auditEvents;
	private final FactorPackImportService imports;
	private final BaseYearService baseYears;
	private final GhgRunRepository runs;
	private final OrganizationUnits organizationUnits;
	private final GhgAccess access;

	FactorPackAdoptionService(FactorPackNoticeRepository notices, FactorPackEditionRepository editions,
			FactorPackRowRepository packRows, EmissionFactorRepository emissionFactors,
			OrganizationRepository organizations, InventoryRepository inventories,
			InventoryAssignmentRepository assignments, GhgAuditEventRepository auditEvents,
			FactorPackImportService imports, BaseYearService baseYears, GhgRunRepository runs,
			OrganizationUnits organizationUnits, GhgAccess access) {
		this.notices = notices;
		this.editions = editions;
		this.packRows = packRows;
		this.emissionFactors = emissionFactors;
		this.organizations = organizations;
		this.inventories = inventories;
		this.assignments = assignments;
		this.auditEvents = auditEvents;
		this.imports = imports;
		this.baseYears = baseYears;
		this.runs = runs;
		this.organizationUnits = organizationUnits;
		this.access = access;
	}

	// --- the inbox ----------------------------------------------------------

	/** Every notice the organization holds, open first and newest first within that (spec 02.7). */
	@Transactional(readOnly = true)
	public List<NoticeView> list(UUID organizationId) {
		access.check(organization(organizationId));
		return notices.findAllByOrganizationIdOrderByRaisedAtDesc(organizationId)
			.stream()
			.sorted(Comparator.comparing((FactorPackNotice notice) -> notice.getStatus() == FactorPackNotice.Status.OPEN
					? 0 : 1).thenComparing(FactorPackNotice::getRaisedAt, Comparator.reverseOrder()))
			.map(this::view)
			.toList();
	}

	private NoticeView view(FactorPackNotice notice) {
		var edition = editions.findById(notice.getEditionId()).orElse(null);
		return new NoticeView(notice, edition == null ? notice.getEditionId() : edition.getName(),
				edition == null ? null : edition.getPackKey(), edition == null ? null : edition.getAppliesFrom(),
				edition == null ? null : edition.getStatus(), edition == null ? null : edition.getWithdrawalReason());
	}

	// --- the diff -----------------------------------------------------------

	/** The per-row comparison a decider reads before answering (spec 02.7). */
	@Transactional(readOnly = true)
	public Diff diff(UUID noticeId) {
		var notice = notices.findById(noticeId).orElseThrow(() -> GhgNotFoundException.factorPackNotice(noticeId));
		access.check(organization(notice.getOrganizationId()));
		return diffOf(notice);
	}

	private Diff diffOf(FactorPackNotice notice) {
		var edition = editions.findById(notice.getEditionId())
			.orElseThrow(() -> GhgNotFoundException.pack(notice.getEditionId()));
		var predecessor = notice.getPredecessorEditionId() == null ? null
				: editions.findById(notice.getPredecessorEditionId()).orElse(null);
		var appliesFrom = edition.getAppliesFrom();
		var organizationId = notice.getOrganizationId();

		// what the edition carries, by lineage
		var proposed = new LinkedHashMap<String, FactorPackRow>();
		packRows.findAllByEditionIdOrderByOrdinalAsc(edition.getEditionId())
			.forEach(row -> proposed.putIfAbsent(row.getCode(), row));
		var previous = new LinkedHashMap<String, FactorPackRow>();
		if (predecessor != null) {
			packRows.findAllByEditionIdOrderByOrdinalAsc(predecessor.getEditionId())
				.forEach(row -> previous.putIfAbsent(row.getCode(), row));
		}

		// what the organization holds of the predecessor's lineages, live versions only
		var held = new LinkedHashMap<String, EmissionFactor>();
		if (!previous.isEmpty()) {
			var byCode = new LinkedHashMap<String, List<EmissionFactor>>();
			for (var factor : emissionFactors.heldByCode(previous.keySet())) {
				if (factor.getOrganizationId() != null && factor.getOrganizationId().equals(organizationId)) {
					byCode.computeIfAbsent(factor.getPackCode(), key -> new ArrayList<>()).add(factor);
				}
			}
			byCode.forEach((code, versions) -> {
				var live = FactorPackImportService.liveVersionOf(versions);
				if (live != null) {
					held.put(code, live);
				}
			});
		}

		// a basis differing from the version the organization holds is shown as a banner and can never
		// be answered as a vintage progression: chapter 1 requires one basis across the inventory and years
		var currentBasis = currentGwpBasis(held.values(), predecessor);
		var newBasis = edition.getGwpBasis();
		var basisChanged = currentBasis != null && newBasis != null && !currentBasis.equalsIgnoreCase(newBasis);

		// a lineage is blocked when the change would fall inside a locked period, which is the rule the
		// import refuses the whole edition on: a reported period keeps the factors it reported with
		var lockedCovering = coveringLockedInventories(organizationId, appliesFrom);
		var lockedFactorIds = lockedCovering.isEmpty() ? java.util.Set.<UUID>of()
				: assignments.factorIdsInInventories(lockedCovering.stream().map(Inventory::getId).toList());
		var movement = estimatedMovement(organizationId, held, proposed);

		var rows = new ArrayList<DiffRow>();
		var conflicts = new ArrayList<ApartRow>();
		var blocked = new ArrayList<ApartRow>();
		var discontinued = new ArrayList<ApartRow>();
		for (var entry : held.entrySet()) {
			var code = entry.getKey();
			var factor = entry.getValue();
			var row = proposed.get(code);
			if (row == null) {
				// spec 02.6 retires nothing: a publisher dropping a row is a decision of its own
				discontinued.add(new ApartRow(code, factor.getName(),
						"The new edition does not carry this lineage. Accepting does not retire it; a retirement is a "
								+ "separate decision under spec 02.6."));
				continue;
			}
			if (factor.isLocallyEdited()) {
				conflicts.add(new ApartRow(code, factor.getName(),
						"Edited here, so the import never touches it, whatever the decision."));
			}
			if (lockedFactorIds.contains(factor.getId())) {
				blocked.add(new ApartRow(code, factor.getName(),
						"Used by an inventory whose period is frozen, final or published. A reported period keeps the "
								+ "factors it reported with."));
			}
			var current = factor.getKgCo2ePerUnit();
			var proposedValue = row.getKgCo2ePerUnit();
			var absolute = current == null || proposedValue == null ? null : proposedValue.subtract(current);
			rows.add(new DiffRow(code, row.getName(), row.getUnit(), current, proposedValue, absolute,
					FactorPackChange.percentChange(current, proposedValue), gasesChanged(factor, row),
					provenanceChanged(factor, row, predecessor, edition), basisChanged,
					movement.getOrDefault(code, BigDecimal.ZERO)));
		}
		rows.sort(Comparator.comparing(DiffRow::code));
		conflicts.sort(Comparator.comparing(ApartRow::code));
		blocked.sort(Comparator.comparing(ApartRow::code));
		discontinued.sort(Comparator.comparing(ApartRow::code));

		var delta = movement.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add).setScale(3, RoundingMode.HALF_UP);
		var draft = currentDraft(organizationId);
		var baseYear = baseYears.of(organizationId).orElse(null);
		return new Diff(notice.getId(), edition.getEditionId(), edition.getName(), notice.getPredecessorEditionId(),
				appliesFrom, notice.getStatus(), List.copyOf(rows), List.copyOf(conflicts), List.copyOf(blocked),
				List.copyOf(discontinued), earlierPeriods(organizationId, appliesFrom), delta, notice.getDiffHash(),
				basisChanged, currentBasis, newBasis, draft == null ? null : draft.getName(),
				lockedCovering.stream().findFirst().map(FactorPackAdoptionService::ref).orElse(null), baseYear != null,
				baseYear == null ? null : baseYear.getThresholdPercent(), affectedPercent(organizationId, delta));
	}

	/**
	 * The Global Warming Potential basis the organization's rows rest on: the
	 * edition that delivered them, or the predecessor the notice names. Chapter
	 * 1 requires one basis across the inventory and across years, so a change of
	 * it is a banner rather than a row.
	 */
	private String currentGwpBasis(java.util.Collection<EmissionFactor> held, FactorPackEdition predecessor) {
		for (var factor : held) {
			if (factor.getSourceEdition() != null) {
				var basis = editions.findById(factor.getSourceEdition()).map(FactorPackEdition::getGwpBasis).orElse(null);
				if (basis != null) {
					return basis;
				}
			}
		}
		return predecessor == null ? null : predecessor.getGwpBasis();
	}

	/** Which gas components the edition moves on one lineage, named the way the report names them. */
	private static List<String> gasesChanged(EmissionFactor factor, FactorPackRow row) {
		var facts = row.facts();
		var moved = new ArrayList<String>();
		if (differs(factor.getCo2KgPerUnit(), facts.co2())) {
			moved.add("CO2");
		}
		if (differs(factor.getCh4KgPerUnit(), facts.ch4())) {
			moved.add("CH4");
		}
		if (differs(factor.getN2oKgPerUnit(), facts.n2o())) {
			moved.add("N2O");
		}
		if (differs(factor.getHfcsKgPerUnit(), facts.hfcsKg())) {
			moved.add("HFCs");
		}
		if (differs(factor.getPfcsKgPerUnit(), facts.pfcsKg())) {
			moved.add("PFCs");
		}
		if (differs(factor.getSf6KgPerUnit(), facts.sf6())) {
			moved.add("SF6");
		}
		if (differs(factor.getNf3KgPerUnit(), facts.nf3())) {
			moved.add("NF3");
		}
		if (differs(factor.getBiogenicCo2KgPerUnit(), row.getBiogenicCo2KgPerUnit())) {
			moved.add("biogenic CO2");
		}
		return List.copyOf(moved);
	}

	/** The publication, its year, the data year, or the GWP basis: the four facts provenance is made of. */
	private static boolean provenanceChanged(EmissionFactor factor, FactorPackRow row, FactorPackEdition predecessor,
			FactorPackEdition edition) {
		var basisMoved = predecessor != null && predecessor.getGwpBasis() != null && edition.getGwpBasis() != null
				&& !predecessor.getGwpBasis().equalsIgnoreCase(edition.getGwpBasis());
		return basisMoved || !java.util.Objects.equals(factor.getPublicationYear(), row.getPublicationYear())
				|| !java.util.Objects.equals(factor.getDataYear(), row.getDataYear())
				|| row.getSourcePublication() != null && factor.getSource() != null
						&& !factor.getSource().startsWith(row.getSourcePublication());
	}

	/**
	 * The tonnage the edition would move, per lineage, over the organization's
	 * current draft period using the activity data already recorded. It is an
	 * estimate and the page says so: it prices each record's quantity at the
	 * difference between the two factors, without the pro-rating and the
	 * accounting share a run applies, and the activity data behind it can change
	 * before the next run.
	 */
	private Map<String, BigDecimal> estimatedMovement(UUID organizationId, Map<String, EmissionFactor> held,
			Map<String, FactorPackRow> proposed) {
		var movement = new LinkedHashMap<String, BigDecimal>();
		var draft = currentDraft(organizationId);
		if (draft == null) {
			return movement;
		}
		var factorIdToCode = new LinkedHashMap<UUID, String>();
		held.forEach((code, factor) -> factorIdToCode.put(factor.getId(), code));
		var units = organizationUnits.forOrganization(organizationId);
		for (var assignment : assignments.findAllByInventoryIdOrderByCreatedAtAsc(draft.getId())) {
			if (!assignment.isIncluded() || assignment.getEmissionFactor() == null) {
				continue;
			}
			var code = factorIdToCode.get(assignment.getEmissionFactor().getId());
			if (code == null) {
				continue;
			}
			var row = proposed.get(code);
			var current = held.get(code).getKgCo2ePerUnit();
			if (row == null || current == null || row.getKgCo2ePerUnit() == null) {
				continue;
			}
			var activity = assignment.getActivity();
			var conversion = Conversion
				.of(units, activity.getQuantity(), activity.getUnit(), assignment.getEmissionFactor().getUnit(),
						assignment.getDensity())
				.orElse(null);
			if (conversion == null) {
				continue;
			}
			var delta = conversion.convertedQuantity().multiply(row.getKgCo2ePerUnit().subtract(current), MC);
			movement.merge(code, delta, BigDecimal::add);
		}
		movement.replaceAll((code, value) -> value.setScale(3, RoundingMode.HALF_UP));
		return movement;
	}

	/**
	 * The period the decision would move: the organization's open draft, latest
	 * first. An organization still working in a frozen period has no draft, and
	 * that period is what the estimate reads instead.
	 */
	private Inventory currentDraft(UUID organizationId) {
		return inventories
			.findAllByOrganizationIdAndStatusOrderByPeriodStartAsc(organizationId, InventoryStatus.DRAFT)
			.stream()
			.reduce((first, second) -> second)
			.or(() -> inventories
				.findAllByOrganizationIdAndStatusOrderByPeriodStartAsc(organizationId, InventoryStatus.FROZEN)
				.stream()
				.reduce((first, second) -> second))
			.orElse(null);
	}

	/**
	 * Inventories whose period ends before the edition applies. They raise
	 * coverage warnings once the edition is accepted, because the new version
	 * does not cover them. The warning is correct and is what a vintage means.
	 */
	private List<InventoryRef> earlierPeriods(UUID organizationId, LocalDate appliesFrom) {
		if (appliesFrom == null) {
			return List.of();
		}
		return inventories.findAllByOrganizationIdOrderByCreatedAtDesc(organizationId)
			.stream()
			.filter(inventory -> inventory.getPeriodEnd().isBefore(appliesFrom))
			.sorted(Comparator.comparing(Inventory::getPeriodStart))
			.map(FactorPackAdoptionService::ref)
			.toList();
	}

	/** The locked inventories whose period covers the applies-from date, which refuse an acceptance. */
	private List<Inventory> coveringLockedInventories(UUID organizationId, LocalDate appliesFrom) {
		if (appliesFrom == null) {
			return List.of();
		}
		return inventories.findAllByOrganizationIdAndStatusInOrderByPeriodStartAsc(organizationId, LOCKED)
			.stream()
			.filter(inventory -> !appliesFrom.isBefore(inventory.getPeriodStart())
					&& !appliesFrom.isAfter(inventory.getPeriodEnd()))
			.toList();
	}

	private static InventoryRef ref(Inventory inventory) {
		return new InventoryRef(inventory.getId(), inventory.getName(), inventory.getPeriodStart(),
				inventory.getPeriodEnd(), inventory.getStatus());
	}

	// --- the decision -------------------------------------------------------

	/**
	 * Accepting: the versioned import of spec 02.6 runs from the edition's
	 * applies-from date, the decision is recorded, and a base-year recalculation
	 * candidate is raised where chapter 5 warrants one.
	 */
	public FactorPackImportService.ImportResult accept(UUID noticeId, String recalculationCase, String note) {
		var notice = decidable(noticeId);
		var organization = organization(notice.getOrganizationId());
		access.checkApprove(organization);
		var answer = answerOf(recalculationCase);
		var diff = diffOf(notice);
		if (diff.gwpBasisChanged() && answer == FactorPackNotice.RecalculationCase.VINTAGE_PROGRESSION) {
			throw new GhgFieldException("recalculationCase", "The edition changes the Global Warming Potential basis "
					+ "from " + diff.currentGwpBasis() + " to " + diff.newGwpBasis() + ", so it cannot be a vintage "
					+ "progression: chapter 1 requires one basis across the inventory and across years. Answer it as a "
					+ "retrospective adoption or an erratum.");
		}
		var trimmedNote = trimToNull(note);
		var baseYear = baseYears.of(notice.getOrganizationId()).orElse(null);
		var threshold = baseYear == null ? null : baseYear.getThresholdPercent();
		var affected = affectedPercent(notice.getOrganizationId(), diff.estimatedKgCo2eDelta());
		var significant = threshold != null && affected != null && affected.compareTo(threshold) >= 0;
		if (answer == FactorPackNotice.RecalculationCase.VINTAGE_PROGRESSION && significant && trimmedNote == null) {
			throw new GhgFieldException("note", "The estimated movement is " + affected.toPlainString()
					+ "% of base-year emissions, at or above the " + threshold.toPlainString()
					+ "% significance threshold, so this is a methodology change under chapter 5. Say why it is still "
					+ "recorded as a vintage progression.");
		}

		// the import refuses the whole edition while a covering period is locked, and writes nothing
		var result = imports.importPack(notice.getOrganizationId(), notice.getEditionId());

		notice.decide(FactorPackNotice.Status.ACCEPTED, access.currentUserId(), access.currentUserEmail(),
				access.roleIn(organization).orElse(OrgRole.REVIEWER), answer, trimmedNote, threshold, affected);
		var recalculation = raiseCandidate(notice, answer, significant, affected, diff);
		notice.recordAdoption(recalculation);
		auditEvents.save(new GhgAuditEvent(notice.getOrganizationId(), GhgAuditEvent.Action.FACTOR_PACK_ADOPTED,
				access.currentUserId(), access.currentUserEmail(),
				access.attributed(organization, "adopted '" + notice.getEditionId() + "' from "
						+ result.appliesFrom() + " as a " + caseLabel(answer)
						+ (recalculation == null ? "; no base-year candidate raised" : "; base-year candidate raised")
						+ (trimmedNote == null ? "" : ": " + trimmedNote))));
		return result;
	}

	/**
	 * The answer to the recalculation question, which acceptance requires. A
	 * missing answer, or one outside the three chapter 5 distinguishes, is 422
	 * on the field rather than a parse failure on the body.
	 */
	private static FactorPackNotice.RecalculationCase answerOf(String value) {
		var trimmed = value == null ? "" : value.trim();
		for (var candidate : FactorPackNotice.RecalculationCase.values()) {
			if (candidate.name().equalsIgnoreCase(trimmed)) {
				return candidate;
			}
		}
		throw new GhgFieldException("recalculationCase", "Say how chapter 5 treats this adoption: "
				+ "VINTAGE_PROGRESSION, RETROSPECTIVE_ADOPTION, or ERRATUM_ON_REPORTED_YEAR.");
	}

	/** Declining: nothing changes and the notice closes. No factor is written, so no period can block it. */
	public NoticeView decline(UUID noticeId, String note) {
		var notice = decidable(noticeId);
		var organization = organization(notice.getOrganizationId());
		access.checkApprove(organization);
		notice.decide(FactorPackNotice.Status.DECLINED, access.currentUserId(), access.currentUserEmail(),
				access.roleIn(organization).orElse(OrgRole.REVIEWER), null, trimToNull(note), null, null);
		auditEvents.save(new GhgAuditEvent(notice.getOrganizationId(), GhgAuditEvent.Action.FACTOR_PACK_DECLINED,
				access.currentUserId(), access.currentUserEmail(), access.attributed(organization,
						"declined '" + notice.getEditionId() + "'"
								+ (trimToNull(note) == null ? "" : ": " + trimToNull(note)))));
		return view(notice);
	}

	private FactorPackNotice decidable(UUID noticeId) {
		var notice = notices.findById(noticeId).orElseThrow(() -> GhgNotFoundException.factorPackNotice(noticeId));
		access.check(organization(notice.getOrganizationId()));
		if (notice.getStatus() != FactorPackNotice.Status.OPEN) {
			throw new GhgRuleViolationException("This notice is already " + notice.getStatus().name().toLowerCase()
					+ ". A decision on an edition is made once.");
		}
		return notice;
	}

	/**
	 * The candidate chapter 5 warrants, if any. A retrospective adoption and a
	 * vintage progression at or above the threshold are methodology changes; an
	 * erratum is an error correction; a vintage progression below the threshold
	 * raises nothing, and the answer on the notice is the record that the
	 * question was asked. An organization with no base year cannot carry a
	 * candidate, so the answer is recorded and nothing is raised.
	 */
	private UUID raiseCandidate(FactorPackNotice notice, FactorPackNotice.RecalculationCase answer, boolean significant,
			BigDecimal affected, Diff diff) {
		if (baseYears.of(notice.getOrganizationId()).isEmpty()) {
			return null;
		}
		RecalculationTrigger trigger = switch (answer) {
			case ERRATUM_ON_REPORTED_YEAR -> RecalculationTrigger.ERROR_CORRECTION;
			case RETROSPECTIVE_ADOPTION -> RecalculationTrigger.METHODOLOGY_CHANGE;
			case VINTAGE_PROGRESSION -> significant ? RecalculationTrigger.METHODOLOGY_CHANGE : null;
		};
		if (trigger == null) {
			return null;
		}
		var scopes = notice.getScopesAffected() == null ? "" : " affecting " + notice.getScopesAffected().toLowerCase()
			.replace("scope_", "scope ").replace(",", ", ");
		var reason = "adopted the factor pack edition '" + notice.getEditionId() + "'"
				+ (notice.getPredecessorEditionId() == null ? "" : " in place of '" + notice.getPredecessorEditionId() + "'")
				+ " as " + caseLabel(answer) + scopes
				+ (diff.appliesFrom() == null ? "" : ", applying from " + diff.appliesFrom());
		var baseYear = baseYears.raise(notice.getOrganizationId(), trigger, reason, affected);
		return baseYear.getRecalculations()
			.stream()
			.reduce((first, second) -> second)
			.map(BaseYearRecalculation::getId)
			.orElse(null);
	}

	/**
	 * The estimated movement as a percentage of the base year's final run total,
	 * which is the affected share {@code BaseYearService.raise} requires. An
	 * organization whose base year has no final run, or whose base run is zero,
	 * has nothing to measure against and reads zero.
	 */
	private BigDecimal affectedPercent(UUID organizationId, BigDecimal delta) {
		var baseYear = baseYears.of(organizationId).orElse(null);
		if (baseYear == null || delta == null) {
			return null;
		}
		var baseRunId = baseYear.getInventory().getFinalRunId();
		var baseRun = baseRunId == null ? null : runs.findById(baseRunId).orElse(null);
		if (baseRun == null || baseRun.getTotalKgCo2e() == null || baseRun.getTotalKgCo2e().signum() == 0) {
			return BigDecimal.ZERO.setScale(2);
		}
		return delta.abs()
			.multiply(new BigDecimal("100"))
			.divide(baseRun.getTotalKgCo2e(), 2, RoundingMode.HALF_UP);
	}

	// --- the report ---------------------------------------------------------

	/**
	 * The accepted notices the report's base-year section prints beside the
	 * recalculations (spec 02.7). A verifier reading a report therefore sees
	 * every vintage decision behind it without opening the product.
	 */
	@Transactional(readOnly = true)
	public List<EditionDecision> decisionsFor(UUID organizationId) {
		return notices
			.findAllByOrganizationIdAndStatusOrderByRaisedAtAsc(organizationId, FactorPackNotice.Status.ACCEPTED)
			.stream()
			.map(notice -> new EditionDecision(notice.getEditionId(), notice.getPredecessorEditionId(),
					notice.getRecalculationCase(), notice.getAffectedPercent(),
					notice.getSignificanceThresholdPercent(), notice.getDecidedAt(), notice.getDecidedBy(),
					notice.getDecisionNote()))
			.toList();
	}

	// --- internals ----------------------------------------------------------

	private Organization organization(UUID organizationId) {
		return organizations.findById(organizationId)
			.orElseThrow(() -> GhgNotFoundException.organization(organizationId));
	}

	/** How the answer reads in prose, for the audit trail, the candidate reason and the report. */
	public static String caseLabel(FactorPackNotice.RecalculationCase answer) {
		return switch (answer) {
			case VINTAGE_PROGRESSION -> "a vintage progression";
			case RETROSPECTIVE_ADOPTION -> "a retrospective adoption";
			case ERRATUM_ON_REPORTED_YEAR -> "an erratum on a reported year";
		};
	}

	private static boolean differs(BigDecimal left, BigDecimal right) {
		var l = left == null ? BigDecimal.ZERO : left;
		var r = right == null ? BigDecimal.ZERO : right;
		return l.compareTo(r) != 0;
	}

	private static String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		var trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
