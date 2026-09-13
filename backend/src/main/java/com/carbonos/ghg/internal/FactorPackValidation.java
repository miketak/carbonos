package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.math.MathContext;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Component;

/**
 * The rules an edition passes before it is published (spec 02.5). Each is a
 * hard failure, never a warning, because a published edition is a citation: a
 * verifier re-performing a sample has to say which published table a figure
 * came from, in which edition, and who put it there.
 *
 * <p>The report is live: the console reads it while a draft is being built, so
 * a curator sees every broken rule at once rather than one refusal at a time.
 *
 * <p><strong>Two of these rules also exist for an organization's own factors,
 * in {@code GhgService.requireFactorFacts}</strong>: the unit registry
 * ({@link #RULE_UNIT}) and the scope-category agreement
 * ({@link #RULE_SCOPE_CATEGORY}). They are two code paths over two tables and
 * neither covers the other, because a pack row is validated on publication and
 * an organization factor on save. A change to one must be made in both.
 */
@Component
public class FactorPackValidation {

	/** A code names the publication and the row, in two colon-separated segments or more. */
	public static final String RULE_CODE = "code";

	/** The publication, its URL, the publication year and the data year are all recorded. */
	public static final String RULE_PROVENANCE = "provenance";

	/** The unit is one {@code UnitConverter} knows; free text is refused. */
	public static final String RULE_UNIT = "unit";

	/** The stated gases, under the edition's GWP basis, come to the stated CO2e within one percent. */
	public static final String RULE_GAS_SPLIT = "gasSplit";

	/** Biogenic CO2 sits beside the stated CO2e per unit, never inside it. */
	public static final String RULE_BIOGENIC = "biogenic";

	/** A Montreal Protocol gas is not a Kyoto gas, so it reports outside the scopes. */
	public static final String RULE_NON_KYOTO = "nonKyoto";

	/** The scope and the category agree, or the row is scope-agnostic. */
	public static final String RULE_SCOPE_CATEGORY = "scopeCategory";

	/** No value without a source, and the only permitted zero is an unapproved template. */
	public static final String RULE_SOURCE_FOR_VALUE = "sourceForValue";

	/** A row approved in a published edition carries the approver and the moment of publication. */
	public static final String RULE_APPROVAL = "approvalAttributable";

	/**
	 * {@code ghg_emission_factors.source} is {@code varchar(500)}, and the
	 * import of spec 02.6 truncates a longer citation to fit. That truncation is
	 * a backstop: a published edition never relies on it.
	 */
	public static final int MAX_CITATION_LENGTH = 500;

	/** Within one percent, as spec 02.5 states the reconciliation. */
	private static final BigDecimal TOLERANCE_PERCENT = new BigDecimal("1");

	private static final BigDecimal HUNDRED = new BigDecimal("100");

	private static final MathContext MC = MathContext.DECIMAL64;

	/**
	 * The gases the Montreal Protocol covers, by the prefix a publisher's row
	 * name carries. DESNZ names them "HCFC-22 (R-22)", "CFC-11 (R-11)",
	 * "Halon-1211", and the three solvents in words.
	 */
	private static final List<String> MONTREAL_PREFIXES = List.of("cfc-", "hcfc-", "halon-", "carbon tetrachloride",
			"methyl bromide", "methyl chloroform", "r-11", "r-12", "r-22", "r-113", "r-114", "r-115");

	/** One broken rule on one row, as the report and a refusal both print it. */
	public record Finding(String rule, String code, String message) {
	}

	private final UnitConverter units;

	FactorPackValidation(UnitConverter units) {
		this.units = units;
	}

	/**
	 * Every rule this edition breaks, in row order. An empty list means the
	 * edition may be published, as far as its rows are concerned.
	 */
	public List<Finding> validate(FactorPackEdition edition, List<FactorPackRow> rows) {
		var findings = new ArrayList<Finding>();
		var gwp = edition.gwp();
		// spec 02.5: SEED_UNCHECKED belongs to the ten editions V43 seeded, whose values were already in
		// production. Three of their rows carry a derivation narrative longer than the citation column, and
		// the file is checksummed by Flyway, so the length clause exempts them and only them.
		var seeded = FactorPackEdition.SEED_UNCHECKED.equals(edition.getProvenanceReview());
		for (var row : rows) {
			checkCode(findings, row);
			checkProvenance(findings, row, seeded);
			checkUnit(findings, row);
			checkGasSplit(findings, row, gwp);
			checkNonKyoto(findings, row);
			checkScopeAndCategory(findings, row);
			checkSourceForValue(findings, row);
		}
		checkApprovalIsAttributable(findings, edition, rows);
		return List.copyOf(findings);
	}

	/**
	 * Rule 1. Two segments are allowed because {@code GHANA:td-losses} is a
	 * derivation rather than a row in a published table. A code must never
	 * change once a published edition carries it: spec 02.6 makes it the lineage
	 * key of rows organizations already hold.
	 */
	private static void checkCode(List<Finding> findings, FactorPackRow row) {
		var code = row.getCode() == null ? "" : row.getCode();
		var segments = code.split(":", -1);
		if (segments.length < 2 || java.util.Arrays.stream(segments).anyMatch(String::isBlank)) {
			findings.add(new Finding(RULE_CODE, code, "The code needs two or more colon-separated segments naming "
					+ "the publication and the row, each of them filled in, as 'GHANA:td-losses' does."));
		}
	}

	/**
	 * Rule 2. An unapproved template stating no value is exempt: it names the
	 * document to obtain rather than a published table, so there is no URL and
	 * no publication year to record until the supplier's document arrives. Rule
	 * 8 is what governs it.
	 */
	private void checkProvenance(List<Finding> findings, FactorPackRow row, boolean seeded) {
		if (isTemplate(row)) {
			return;
		}
		var missing = new ArrayList<String>();
		if (isBlank(row.getSourcePublication())) {
			missing.add("the source publication");
		}
		if (!isAbsoluteUrl(row.getSourceUrl())) {
			missing.add("an absolute source URL");
		}
		if (row.getPublicationYear() == null) {
			missing.add("the publication year");
		}
		if (row.getDataYear() == null) {
			missing.add("the data year");
		}
		if (!missing.isEmpty()) {
			findings.add(new Finding(RULE_PROVENANCE, row.getCode(),
					"The row is missing " + String.join(", ", missing) + "."));
		}
		if (!seeded && !citationFits(row)) {
			findings.add(new Finding(RULE_PROVENANCE, row.getCode(),
					"The citation is " + row.citation().length() + " characters; it must fit "
							+ MAX_CITATION_LENGTH + ", the width of the column an import writes it to. "
							+ "Shorten the publisher's detail."));
		}
	}

	/** Whether the citation an import builds fits the column it is written to. */
	public static boolean citationFits(FactorPackRow row) {
		return row.citation().length() <= MAX_CITATION_LENGTH;
	}

	/** Rule 3. Also in {@code GhgService.requireFactorFacts} for an organization's own factors. */
	private void checkUnit(List<Finding> findings, FactorPackRow row) {
		if (units.dimensionOf(row.getUnit()).isEmpty()) {
			findings.add(new Finding(RULE_UNIT, row.getCode(), "'" + row.getUnit()
					+ "' is not a registered unit; records in it could not be converted. "
					+ "Choose a unit from the registry."));
		}
	}

	/**
	 * Rules 4 and 5. Where the row states any component, the sum of each times
	 * its potential under the edition's GWP basis equals the stated CO2e within
	 * one percent, and the biogenic CO2 is not part of that sum.
	 *
	 * <p>A row publishing no split declares itself CO2e only and is exempt. So
	 * is a row whose HFC or PFC mass has no composition the basis can convert:
	 * a blend without one keeps the CO2e its source applied, which is how the
	 * whole library treats it, and 211 of the seeded rows are exactly that.
	 */
	private static void checkGasSplit(List<Finding> findings, FactorPackRow row, GwpSet gwp) {
		if (row.isCo2eOnly()) {
			return;
		}
		var stated = row.facts();
		if (stated.co2() == null && stated.ch4() == null && stated.n2o() == null && stated.hfcsKg() == null
				&& stated.pfcsKg() == null && stated.sf6() == null && stated.nf3() == null) {
			return;
		}
		var total = zero(stated.co2());
		total = total.add(times(stated.ch4(), gwp.ch4(stated.ch4Fossil())));
		total = total.add(times(stated.n2o(), gwp.n2o()));
		total = total.add(times(stated.sf6(), gwp.sf6()));
		total = total.add(times(stated.nf3(), gwp.nf3()));
		var blend = blendPotential(stated.blendComposition(), gwp);
		for (var mass : List.of(zero(stated.hfcsKg()), zero(stated.pfcsKg()))) {
			if (mass.signum() != 0) {
				if (blend == null) {
					// the potential of this mass is not knowable under the basis; the source's CO2e stands
					return;
				}
				total = total.add(mass.multiply(blend, MC));
			}
		}
		var claimed = zero(stated.kgCo2ePerUnit());
		if (claimed.signum() == 0) {
			if (total.signum() != 0) {
				findings.add(new Finding(RULE_GAS_SPLIT, row.getCode(), "The row states no CO2e per unit, but its "
						+ "gases come to " + total.round(MC).toPlainString() + " kg CO2e under " + gwp + "."));
			}
			return;
		}
		var difference = total.subtract(claimed).abs().divide(claimed.abs(), MC).multiply(HUNDRED, MC);
		if (difference.compareTo(TOLERANCE_PERCENT) <= 0) {
			return;
		}
		var biogenic = zero(row.getBiogenicCo2KgPerUnit());
		if (biogenic.signum() != 0) {
			var withBiogenic = total.add(biogenic).subtract(claimed).abs().divide(claimed.abs(), MC).multiply(HUNDRED,
					MC);
			if (withBiogenic.compareTo(TOLERANCE_PERCENT) <= 0) {
				findings.add(new Finding(RULE_BIOGENIC, row.getCode(),
						"The stated CO2e per unit includes the biogenic CO2. Chapter 9 reports biogenic CO2 "
								+ "beside the total, never inside it: state " + total.round(MC).toPlainString()
								+ " and keep " + biogenic.toPlainString() + " as the biogenic CO2."));
				return;
			}
		}
		findings.add(new Finding(RULE_GAS_SPLIT, row.getCode(),
				"The gases come to " + total.round(MC).toPlainString() + " kg CO2e under " + gwp + ", which is "
						+ difference.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString()
						+ "% from the stated " + claimed.toPlainString() + ". They must agree within one percent."));
	}

	/** Rule 6. Chapter 4 counts the seven Kyoto gas groups; a Montreal Protocol gas is not one of them. */
	private static void checkNonKyoto(List<Finding> findings, FactorPackRow row) {
		if (!isMontrealProtocolGas(row) || row.getReportingBasis() != ReportingBasis.SCOPES) {
			return;
		}
		findings.add(new Finding(RULE_NON_KYOTO, row.getCode(), "'" + row.getName()
				+ "' is a Montreal Protocol gas, not a Kyoto gas. Its basis must be OUTSIDE_SCOPES_NON_KYOTO, "
				+ "so its mass is disclosed separately and never enters a scope total."));
	}

	/** Rule 7. Also in {@code GhgService.requireFactorFacts} for an organization's own factors. */
	private static void checkScopeAndCategory(List<Finding> findings, FactorPackRow row) {
		if (row.isScopeAgnostic() || row.getDefaultCategory() == null || row.getDefaultScope() == null) {
			return;
		}
		if (row.getDefaultCategory().scope() != row.getDefaultScope()) {
			findings.add(new Finding(RULE_SCOPE_CATEGORY, row.getCode(), row.getDefaultCategory() + " is not a "
					+ row.getDefaultScope().name().toLowerCase(Locale.ROOT).replace('_', ' ') + " category."));
		}
	}

	/**
	 * Rule 8. A non-zero CO2e with no source publication is refused. The only
	 * permitted zero is an unapproved template whose note names the document to
	 * obtain, which is how a sector pack ships a supplier factor nobody has yet.
	 */
	private static void checkSourceForValue(List<Finding> findings, FactorPackRow row) {
		var value = zero(row.getKgCo2ePerUnit());
		if (value.signum() != 0) {
			if (isBlank(row.getSourcePublication())) {
				findings.add(new Finding(RULE_SOURCE_FOR_VALUE, row.getCode(),
						"The row states a CO2e per unit with no source publication. Name where the value comes from."));
			}
			return;
		}
		if (row.isApproved()) {
			findings.add(new Finding(RULE_SOURCE_FOR_VALUE, row.getCode(),
					"A zero CO2e per unit is approved. A zero is only allowed on an unapproved template, "
							+ "because an approved zero reads as a measured absence of emissions."));
			return;
		}
		if (!namesADocument(row.getNotes()) && !namesADocument(row.getSourcePublication())) {
			findings.add(new Finding(RULE_SOURCE_FOR_VALUE, row.getCode(),
					"A zero CO2e per unit is only allowed on an unapproved template whose note names the document "
							+ "to obtain, for example the supplier's product carbon footprint or environmental "
							+ "product declaration."));
		}
	}

	/**
	 * Rule 9. A published edition carrying approved rows records who approved it
	 * and when, unless it is one of the ten {@code V43} seeded, whose values were
	 * in production before the catalogue existed. On a draft the rule has nothing
	 * to say: publication is what makes the approval attributable.
	 */
	private static void checkApprovalIsAttributable(List<Finding> findings, FactorPackEdition edition,
			List<FactorPackRow> rows) {
		if (edition.isMutable() || rows.stream().noneMatch(FactorPackRow::isApproved)) {
			return;
		}
		if (FactorPackEdition.SEED_UNCHECKED.equals(edition.getProvenanceReview())) {
			return;
		}
		if (edition.getApproverUserId() == null || edition.getPublishedAt() == null) {
			findings.add(new Finding(RULE_APPROVAL, edition.getEditionId(),
					"The edition carries approved rows but records no approver and no moment of publication."));
		}
	}

	/** An unapproved row stating no value: a template naming the document to obtain, not a factor. */
	private static boolean isTemplate(FactorPackRow row) {
		return !row.isApproved() && zero(row.getKgCo2ePerUnit()).signum() == 0;
	}

	private static boolean namesADocument(String text) {
		if (isBlank(text)) {
			return false;
		}
		var lower = text.toLowerCase(Locale.ROOT);
		return lower.contains("product carbon footprint") || lower.contains("environmental product declaration")
				|| lower.contains("declaration") || lower.contains("document") || lower.contains("certificate")
				|| lower.contains("statement") || lower.contains("invoice")
				|| lower.contains("supplier factor, to be obtained");
	}

	private static boolean isMontrealProtocolGas(FactorPackRow row) {
		var name = row.getName() == null ? "" : row.getName().trim().toLowerCase(Locale.ROOT);
		return MONTREAL_PREFIXES.stream().anyMatch(name::startsWith);
	}

	private static boolean isAbsoluteUrl(String url) {
		if (isBlank(url)) {
			return false;
		}
		try {
			return URI.create(url.trim()).isAbsolute();
		}
		catch (IllegalArgumentException ex) {
			return false;
		}
	}

	private static boolean isBlank(String text) {
		return text == null || text.isBlank();
	}

	private static BigDecimal zero(BigDecimal value) {
		return value == null ? BigDecimal.ZERO : value;
	}

	private static BigDecimal times(BigDecimal mass, BigDecimal potential) {
		return mass == null ? BigDecimal.ZERO : mass.multiply(potential, MC);
	}

	/** kg CO2e per kg of the recorded blend under the basis, or null when the basis cannot convert it. */
	private static BigDecimal blendPotential(String composition, GwpSet gwp) {
		if (composition == null || composition.isBlank()) {
			return null;
		}
		try {
			var parsed = BlendComposition.parse(composition);
			return parsed == null ? null : parsed.kgCo2ePerKg(gwp);
		}
		catch (RuntimeException ex) {
			return null;
		}
	}
}
