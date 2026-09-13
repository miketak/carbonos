package com.carbonos.ghg.internal;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carbonos.user.UserDirectory;

/**
 * The factor pack maintenance console (spec 02.5): a platform administrator
 * creates a family and a draft edition, clones a predecessor's rows into a new
 * draft, authors the rows, and reads the live validation report.
 *
 * <p>{@code access.checkAdmin()} is the first line of every method, as
 * {@link SupportAccessService} does it. The path {@code /api/admin/**} is
 * already reserved for the ADMIN platform role in {@code SecurityConfig}; the
 * service checks again so a bean call from anywhere else is refused too.
 *
 * <p>Only a draft is mutable. A published edition's rows, metadata and values
 * never change, because reports already rest on them, and clause 8.2 requires
 * the records behind a reported figure to be retained. Publication itself, the
 * evidence upload, the separation-of-duties gate and the blast radius are the
 * publication phase of this spec; {@link #publish} refuses until they land.
 */
@Service
@Transactional
public class FactorPackAdminService {

	/** A family key and an edition identifier are both citation keys: lowercase, stable, no spaces. */
	private static final Pattern KEY = Pattern.compile("[a-z0-9][a-z0-9.-]{1,59}");

	/** One family with every edition of it, as the console's list reads (spec 02.5). */
	public record FamilyView(FactorPackFamily family, List<EditionView> editions) {
	}

	/** One edition with the two counts the console shows beside its status. */
	public record EditionView(FactorPackEdition edition, long rowCount, long holderCount) {
	}

	/** One page of an edition's rows, with the values the workbench filters by. */
	public record RowPage(List<FactorPackRow> rows, int page, int size, long total, List<String> categories,
			List<String> activities, List<String> units) {
	}

	/** What a curator states when creating a family. */
	public record FamilyFacts(String packKey, String name, FactorPackKind kind, String summary) {
	}

	/** What a curator states when creating a draft: the edition's own facts, plus a predecessor to clone. */
	public record DraftFacts(String editionId, FactorPackEdition.Facts facts, String cloneFrom) {
	}

	private final FactorPackFamilyRepository families;
	private final FactorPackEditionRepository editions;
	private final FactorPackRowRepository rows;
	private final EmissionFactorRepository emissionFactors;
	private final FactorPackValidation validation;
	private final GhgAccess access;
	private final UserDirectory userDirectory;

	FactorPackAdminService(FactorPackFamilyRepository families, FactorPackEditionRepository editions,
			FactorPackRowRepository rows, EmissionFactorRepository emissionFactors, FactorPackValidation validation,
			GhgAccess access, UserDirectory userDirectory) {
		this.families = families;
		this.editions = editions;
		this.rows = rows;
		this.emissionFactors = emissionFactors;
		this.validation = validation;
		this.access = access;
		this.userDirectory = userDirectory;
	}

	// --- families and editions ----------------------------------------------

	/** Every family with its editions, their row counts and how many organizations hold each. */
	@Transactional(readOnly = true)
	public List<FamilyView> listFamilies() {
		access.checkAdmin();
		var rowCounts = countsByEdition();
		var holderCounts = holdersByEdition();
		var byFamily = new LinkedHashMap<String, List<EditionView>>();
		for (var edition : editions.findAllByOrderByPackKeyAscEditionIdAsc()) {
			byFamily.computeIfAbsent(edition.getPackKey(), key -> new java.util.ArrayList<>())
				.add(view(edition, rowCounts, holderCounts));
		}
		return families.findAllByOrderByPackKeyAsc()
			.stream()
			.map(family -> new FamilyView(family, List.copyOf(byFamily.getOrDefault(family.getPackKey(), List.of()))))
			.toList();
	}

	/** Creates a family: the lineage of one publication, keyed for good. */
	public FactorPackFamily createFamily(FamilyFacts facts) {
		access.checkAdmin();
		var packKey = required("packKey", facts.packKey());
		requireKey("packKey", packKey);
		if (families.existsById(packKey)) {
			throw new GhgRuleViolationException(
					"A pack family keyed '" + packKey + "' already exists. Add an edition to it instead.");
		}
		if (facts.kind() == null) {
			throw new GhgFieldException("kind", "Say whether the family is a published table (SOURCE) or a "
					+ "selection assembled for a sector (SECTOR).");
		}
		return families.save(new FactorPackFamily(packKey, required("name", facts.name()), facts.kind(),
				trimToNull(facts.summary())));
	}

	/**
	 * Creates a draft edition of a family, empty or cloned from a predecessor.
	 * A clone copies the predecessor's rows exactly, in its order, so a curator
	 * starts from the last edition and corrects what moved.
	 */
	public EditionView createEdition(String packKey, DraftFacts draft) {
		access.checkAdmin();
		var family = families.findById(packKey).orElseThrow(() -> GhgNotFoundException.pack(packKey));
		var editionId = required("editionId", draft.editionId());
		requireKey("editionId", editionId);
		if (editions.existsById(editionId)) {
			throw new GhgRuleViolationException("An edition named '" + editionId
					+ "' already exists. An edition identifier is the citation a report prints, so it is never reused.");
		}
		var facts = requireEditionFacts(draft.facts());
		var curatorId = access.currentUserId();
		var email = userDirectory.findById(curatorId)
			.map(UserDirectory.UserSummary::email)
			.orElseGet(access::currentUserEmail);
		var name = userDirectory.findById(curatorId).map(UserDirectory.UserSummary::displayName).orElse(email);
		var edition = editions
			.save(new FactorPackEdition(editionId, family.getPackKey(), facts, curatorId, email, name));
		if (draft.cloneFrom() != null && !draft.cloneFrom().isBlank()) {
			var predecessor = editions.findById(draft.cloneFrom().trim())
				.orElseThrow(() -> GhgNotFoundException.pack(draft.cloneFrom().trim()));
			var copied = rows.findAllByEditionIdOrderByOrdinalAsc(predecessor.getEditionId())
				.stream()
				.map(row -> new FactorPackRow(edition.getEditionId(), row))
				.toList();
			rows.saveAll(copied);
		}
		return view(edition);
	}

	@Transactional(readOnly = true)
	public EditionView edition(String editionId) {
		access.checkAdmin();
		return view(get(editionId));
	}

	/** Edits a draft's metadata. Against a published edition this is 409: its metadata never changes. */
	public EditionView updateEdition(String editionId, FactorPackEdition.Facts facts) {
		access.checkAdmin();
		var edition = mutable(editionId);
		edition.update(requireEditionFacts(facts));
		return view(edition);
	}

	/**
	 * Deletes a draft that was never published and that no organization holds.
	 * A published edition and its rows can never be deleted: clause 8.2 requires
	 * the records behind a reported figure to be retained.
	 */
	public void deleteEdition(String editionId) {
		access.checkAdmin();
		var edition = mutable(editionId);
		var holders = holdersByEdition().getOrDefault(editionId, 0L);
		if (holders > 0) {
			throw new GhgRuleViolationException("'" + editionId + "' was imported by " + holders
					+ (holders == 1 ? " organization" : " organizations")
					+ ", so its rows are part of their records and it is kept.");
		}
		rows.deleteAll(rows.findAllByEditionIdOrderByOrdinalAsc(editionId));
		editions.delete(edition);
	}

	// --- rows ---------------------------------------------------------------

	/** One page of an edition's rows, filtered by the publisher's taxonomy, the unit and a search term. */
	@Transactional(readOnly = true)
	public RowPage rows(String editionId, String category, String activity, String unit, String search, int page,
			int size) {
		access.checkAdmin();
		var edition = get(editionId);
		var term = trimToNull(search);
		var found = rows.search(edition.getEditionId(), trimToNull(category), trimToNull(activity), trimToNull(unit),
				term == null ? null : "%" + term.toLowerCase(Locale.ROOT) + "%",
				PageRequest.of(Math.max(0, page), Math.clamp(size, 1, 200)));
		return new RowPage(found.getContent(), found.getNumber(), found.getSize(), found.getTotalElements(),
				rows.categoriesOf(edition.getEditionId()), rows.activitiesOf(edition.getEditionId()),
				rows.unitsOf(edition.getEditionId()));
	}

	/** Adds a row to a draft, at the end of the order the publication lists. */
	public FactorPackRow addRow(String editionId, FactorPackRow.Facts facts) {
		access.checkAdmin();
		var edition = mutable(editionId);
		var clean = requireRowFacts(facts);
		rows.findByEditionIdAndCode(edition.getEditionId(), clean.code()).ifPresent(existing -> {
			throw new GhgFieldException("code",
					"This edition already carries a row coded '" + clean.code() + "'. A code names one row.");
		});
		return rows.save(new FactorPackRow(edition.getEditionId(),
				rows.highestOrdinal(edition.getEditionId()) + 1, clean));
	}

	public FactorPackRow updateRow(UUID rowId, FactorPackRow.Facts facts) {
		access.checkAdmin();
		var row = rows.findById(rowId).orElseThrow(() -> GhgNotFoundException.emissionFactor(rowId));
		mutable(row.getEditionId());
		var clean = requireRowFacts(facts);
		rows.findByEditionIdAndCode(row.getEditionId(), clean.code()).ifPresent(existing -> {
			if (!existing.getId().equals(rowId)) {
				throw new GhgFieldException("code",
						"This edition already carries a row coded '" + clean.code() + "'. A code names one row.");
			}
		});
		row.update(clean);
		return row;
	}

	public void deleteRow(UUID rowId) {
		access.checkAdmin();
		var row = rows.findById(rowId).orElseThrow(() -> GhgNotFoundException.emissionFactor(rowId));
		mutable(row.getEditionId());
		rows.delete(row);
	}

	// --- validation ---------------------------------------------------------

	/** Every rule the edition's rows break, read live while the draft is built. */
	@Transactional(readOnly = true)
	public List<FactorPackValidation.Finding> validate(String editionId) {
		access.checkAdmin();
		var edition = get(editionId);
		return validation.validate(edition, rows.findAllByEditionIdOrderByOrdinalAsc(edition.getEditionId()));
	}

	/**
	 * Publication is the next phase of spec 02.5: the evidence file and its
	 * checksum, the separation-of-duties gate, the frozen change log, the blast
	 * radius and the notices. Refusing plainly is better than publishing an
	 * edition half of whose record is missing.
	 */
	public void publish(String editionId) {
		access.checkAdmin();
		var edition = mutable(editionId);
		throw new GhgRuleViolationException("Publishing '" + edition.getEditionId()
				+ "' is not available yet. Authoring, cloning and the validation report ship first; publication "
				+ "needs the evidence file with its checksum, an approver who is not the curator, the frozen "
				+ "change log and the blast radius, which arrive in the next release.");
	}

	// --- internals ----------------------------------------------------------

	private FactorPackEdition get(String editionId) {
		return editions.findById(editionId == null ? "" : editionId.trim())
			.orElseThrow(() -> GhgNotFoundException.pack(editionId));
	}

	/** The edition, if a curator may still change it. Anything but a draft is frozen (409). */
	private FactorPackEdition mutable(String editionId) {
		var edition = get(editionId);
		if (!edition.isMutable()) {
			throw new GhgRuleViolationException("'" + edition.getEditionId() + "' is "
					+ edition.getStatus().name().toLowerCase(Locale.ROOT)
					+ ". A published edition's rows, metadata and values never change, because reports already "
					+ "rest on them. Clone it into a new draft instead.");
		}
		return edition;
	}

	private EditionView view(FactorPackEdition edition) {
		return view(edition, countsByEdition(), holdersByEdition());
	}

	private static EditionView view(FactorPackEdition edition, Map<String, Long> rowCounts,
			Map<String, Long> holderCounts) {
		return new EditionView(edition, rowCounts.getOrDefault(edition.getEditionId(), 0L),
				holderCounts.getOrDefault(edition.getEditionId(), 0L));
	}

	private Map<String, Long> countsByEdition() {
		var counts = new LinkedHashMap<String, Long>();
		for (var row : editions.countRowsByEdition()) {
			counts.put((String) row[0], ((Number) row[1]).longValue());
		}
		return counts;
	}

	private Map<String, Long> holdersByEdition() {
		var counts = new LinkedHashMap<String, Long>();
		for (var row : emissionFactors.countHoldersByEdition()) {
			counts.put((String) row[0], ((Number) row[1]).longValue());
		}
		return counts;
	}

	private static FactorPackEdition.Facts requireEditionFacts(FactorPackEdition.Facts facts) {
		if (facts == null) {
			throw new GhgFieldException("name", "Give the edition a name.");
		}
		var name = required("name", facts.name());
		var source = required("source", facts.source());
		if (facts.publicationYear() == null) {
			throw new GhgFieldException("publicationYear",
					"Give the year the source was published; it is what a citation dates.");
		}
		if (facts.gwpBasis() == null || facts.gwpBasis().isBlank()) {
			throw new GhgFieldException("gwpBasis",
					"Name the GWP basis the publication states, so the gas split can be reconciled against it.");
		}
		var basis = facts.gwpBasis().trim().toUpperCase(Locale.ROOT);
		if (java.util.Arrays.stream(GwpSet.values()).noneMatch(set -> set.name().equals(basis))) {
			throw new GhgFieldException("gwpBasis", "'" + facts.gwpBasis() + "' is not a GWP set CarbonOS knows. "
					+ "Use AR5 or AR6.");
		}
		return new FactorPackEdition.Facts(name, source, trimToNull(facts.sourceUrl()), facts.publicationYear(), basis,
				trimToNull(facts.license()), trimToNull(facts.retrieved()), trimToNull(facts.notes()),
				facts.appliesFrom());
	}

	private static FactorPackRow.Facts requireRowFacts(FactorPackRow.Facts facts) {
		if (facts == null) {
			throw new GhgFieldException("code", "Give the row a code.");
		}
		var code = required("code", facts.code());
		var name = required("name", facts.name());
		var unit = required("unit", facts.unit());
		if (facts.kgCo2ePerUnit() == null) {
			throw new GhgFieldException("kgCo2ePerUnit",
					"State the kg CO2e per unit the publication gives, or zero on a template.");
		}
		if (facts.defaultScope() == null) {
			throw new GhgFieldException("defaultScope", "Choose the scope the row defaults to.");
		}
		if (facts.defaultCategory() == null) {
			throw new GhgFieldException("defaultCategory", "Choose the category the row defaults to.");
		}
		return new FactorPackRow.Facts(code, name, facts.defaultScope(), facts.defaultCategory(),
				facts.scopeAgnostic(), unit, facts.kgCo2ePerUnit(), facts.co2(), facts.ch4(), facts.ch4Fossil(),
				facts.n2o(), facts.hfcsKg(), facts.pfcsKg(), facts.sf6(), facts.nf3(), facts.biogenicCo2(),
				trimToNull(facts.blendComposition()), trimToNull(facts.blendGwpSource()), facts.dataYear(),
				trimToNull(facts.sourcePublication()), trimToNull(facts.sourceUrl()), facts.publicationYear(),
				trimToNull(facts.sourceCategory()), trimToNull(facts.sourceActivity()),
				trimToNull(facts.sourceDetail()), facts.co2eOnly(), facts.approved(), trimToNull(facts.notes()),
				facts.reportingBasis());
	}

	private static void requireKey(String field, String value) {
		if (!KEY.matcher(value).matches()) {
			throw new GhgFieldException(field, "Use lowercase letters, digits, hyphens and dots, 2 to 60 characters, "
					+ "as 'defra' and 'defra-2026.r2' do. It is a citation key, so it never changes.");
		}
	}

	private static String required(String field, String value) {
		var trimmed = value == null ? "" : value.trim();
		if (trimmed.isEmpty()) {
			throw new GhgFieldException(field, "This is required.");
		}
		return trimmed;
	}

	private static String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		var trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
