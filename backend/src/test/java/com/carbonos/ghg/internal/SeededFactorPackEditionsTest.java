package com.carbonos.ghg.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import com.carbonos.TestcontainersConfiguration;

/**
 * What the seeded editions must contain (specs 02.3, 02.5 and 02.9). The
 * catalogue is the source of truth: the JSON files the seed was built from, and
 * the script that wrote them, are gone, so there is no file left to disagree
 * with the database. What the oracle used to prove row by row is proved by
 * shape and by sample: the two editions are there with the row counts they
 * ship, the two read paths agree on every card field, every row cites the
 * publication it comes from, and Montreal Protocol rows report outside the
 * scopes.
 *
 * <p>Spec 02.9 narrowed the catalogue from ten editions to two. {@code V43}
 * seeded ten and {@code V50} removed the eight CarbonOS does not stand behind,
 * so what this file asserts is what survives both: {@code defra-2026} and
 * {@code ghana}. The assertions that reached into the EPA Hub, IPCC, NGA and
 * sector packs went with those packs.
 *
 * <p>Its last assertions are the guard the publication rules add: both editions
 * pass every rule of {@link FactorPackValidation}, so the rules and the corpus
 * we shipped cannot drift apart, and not one row relies on an exemption.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class SeededFactorPackEditionsTest {

	/** The rows each pack ships with, which the seeded editions must still carry exactly. */
	private static final Map<String, Integer> SHIPPED_ROW_COUNTS = Map.of("defra-2026", 1868, "ghana", 7);

	@Autowired
	private FactorPacks packs;

	@Autowired
	private FactorPackEditionRepository editions;

	@Autowired
	private FactorPackRowRepository rows;

	@Autowired
	private FactorPackValidation validation;

	private FactorPacks.Pack pack(String id) {
		return packs.find(id).orElseThrow(() -> new AssertionError("pack " + id + " is missing"));
	}

	private static FactorPacks.PackFactor row(FactorPacks.Pack pack, String code) {
		return pack.factors()
			.stream()
			.filter(factor -> factor.code().equals(code))
			.findFirst()
			.orElseThrow(() -> new AssertionError(pack.id() + " no longer carries " + code));
	}

	@Test
	void theTwoSeededEditionsCarryTheRowsTheyShippedWith() {
		assertThat(packs.all().stream().map(FactorPacks.Pack::id))
			.containsExactlyInAnyOrderElementsOf(SHIPPED_ROW_COUNTS.keySet());
		// the header projection counts the same rows without assembling them
		assertThat(packs.headers()).allSatisfy(header -> assertThat(header.factorCount()).as(header.id())
			.isEqualTo(SHIPPED_ROW_COUNTS.get(header.id())));
		assertThat(packs.headers().stream().mapToInt(FactorPacks.PackHeader::factorCount).sum()).isEqualTo(1875);
		var headers = packs.headers()
			.stream()
			.collect(Collectors.toMap(FactorPacks.PackHeader::id, header -> header));
		for (var entry : SHIPPED_ROW_COUNTS.entrySet()) {
			var as = entry.getKey();
			var seeded = pack(entry.getKey());
			var header = headers.get(entry.getKey());
			assertThat(seeded.factors()).as(as).hasSize(entry.getValue());
			// the list draws its card from the projection and the import reads the assembled pack:
			// one edition, two read paths, and they must say the same thing about it
			assertThat(seeded.name()).as(as).isEqualTo(header.name()).isNotBlank();
			assertThat(seeded.source()).as(as).isEqualTo(header.source()).isNotBlank();
			assertThat(seeded.sourceUrl()).as(as).isEqualTo(header.sourceUrl()).isNotNull();
			assertThat(seeded.publicationYear()).as(as).isEqualTo(header.publicationYear()).isNotNull();
			assertThat(seeded.gwpBasis()).as(as).isEqualTo(header.gwpBasis()).isNotBlank();
			assertThat(seeded.license()).as(as).isEqualTo(header.license()).isNotBlank();
			assertThat(seeded.retrieved()).as(as).isEqualTo(header.retrieved()).isNotBlank();
			assertThat(seeded.notes()).as(as).isEqualTo(header.notes()).isNotBlank();
			// spec 02.6: an import cuts a version dated by the edition it came from
			assertThat(seeded.appliesFrom()).as(as).isNotNull();
			// a code names one row of an edition, which is what a citation to it relies on
			assertThat(seeded.factors().stream().map(FactorPacks.PackFactor::code)).as(as)
				.doesNotHaveDuplicates()
				.allSatisfy(code -> assertThat(code).isNotBlank());
			assertThat(seeded.factors()).as(as).allSatisfy(factor -> {
				assertThat(factor.name()).as("%s / %s", as, factor.code()).isNotBlank();
				assertThat(factor.unit()).as("%s / %s", as, factor.code()).isNotBlank();
				assertThat(factor.defaultScope()).as("%s / %s", as, factor.code()).isNotNull();
			});
		}
	}

	@Test
	void theCatalogueOffersOnlyTheTwoPublicationsWeStandBehind() {
		// spec 02.9: what an organization can import is DESNZ and Ghana, and nothing else. The
		// console stays open, so this asserts what the seed leaves behind rather than a ceiling
		// on what a curator may later author.
		assertThat(editions.findAll()).extracting(FactorPackEdition::getPackKey)
			.containsOnly("defra", "ghana");
		assertThat(packs.headers()).extracting(FactorPacks.PackHeader::id)
			.containsExactlyInAnyOrder("defra-2026", "ghana");
	}

	@Test
	void everySeededEditionIsPublishedWithAnEvidenceChecksumAndNoApprover() {
		var published = editions.findAllByStatusOrderByEditionIdAsc(FactorPackStatus.PUBLISHED);
		assertThat(published.stream().map(FactorPackEdition::getEditionId))
			.containsExactlyInAnyOrderElementsOf(SHIPPED_ROW_COUNTS.keySet());
		assertThat(published).allSatisfy(edition -> {
			var as = edition.getEditionId();
			assertThat(edition.getEvidenceChecksum()).as(as).hasSize(64);
			assertThat(edition.getSourceDocument()).as(as).contains(edition.getEditionId() + ".json");
			assertThat(edition.getPublishedAt()).as(as).isNotNull();
			// each applies from 1 January of its publication year
			assertThat(edition.getAppliesFrom()).as(as).isNotNull();
			assertThat(edition.getAppliesFrom().getYear()).as(as).isEqualTo(edition.getPublicationYear());
			assertThat(edition.getAppliesFrom().getDayOfYear()).as(as).isEqualTo(1);
			// the seed is not a separation-of-duties record, and says so
			assertThat(edition.getProvenanceReview()).as(as).isEqualTo(FactorPackEdition.SEED_UNCHECKED);
			assertThat(edition.getCuratorName()).as(as).isEqualTo("seed");
			assertThat(edition.getApproverUserId()).as(as).isNull();
			assertThat(edition.getApproverName()).as(as).isNull();
			assertThat(edition.getProvenanceNote()).as(as)
				.contains("not of the publication")
				.contains("starts at the next edition");
		});
	}

	@Test
	void everyRowRecordsThePublishersTaxonomyInItsParts() {
		for (var pack : packs.all()) {
			for (var factor : pack.factors()) {
				var as = pack.id() + " / " + factor.code();
				assertThat(factor.sourcePath()).as(as).isNotBlank();
				// a category never carries a separator of its own: it is one level of the publisher's table
				if (factor.sourceCategory() != null) {
					assertThat(factor.sourceCategory()).as(as).doesNotContain(" / ");
				}
			}
		}
		// the DESNZ table's own three levels, which a display name alone cannot tell apart
		var butane = row(pack("defra-2026"), "DEFRA:Fuels:Gaseous_fuels_Butane:tonnes");
		assertThat(butane.sourceCategory()).isEqualTo("Fuels");
		assertThat(butane.sourceActivity()).isEqualTo("Gaseous fuels / Butane");
		assertThat(butane.sourceDetail()).isNull();
		var aluminium = row(pack("defra-2026"),
				"DEFRA:Waste_disposal:Metal_Metal:_aluminium_cans_and_foil_excl._forming_:Combustion:tonnes");
		assertThat(aluminium.sourceCategory()).isEqualTo("Waste disposal");
		assertThat(aluminium.sourceActivity()).isEqualTo("Metal / Metal: aluminium cans and foil (excl. forming)");
		assertThat(aluminium.sourceDetail()).isEqualTo("Combustion");
		// a Ghana grid row: the country is the activity and the data year is the detail, so two
		// years of the same series are told apart by their parts rather than by their name
		var ghana2024 = row(pack("ghana"), "GHANA:grid:GHA:2024");
		assertThat(ghana2024.sourceCategory()).isEqualTo("Electricity (national grid, generation-based)");
		assertThat(ghana2024.sourceActivity()).isEqualTo("Ghana (GHA)");
		assertThat(ghana2024.sourceDetail()).contains("data year 2024").contains("location-based");
		// a hand-written derivation cites a document rather than a table row: the citation is the detail
		var losses = row(pack("ghana"), "GHANA:td-losses");
		assertThat(losses.sourceCategory()).isNull();
		assertThat(losses.sourceActivity()).isNull();
		assertThat(losses.sourceDetail()).contains("Scope 3 category 3");
		// three butane rows share a display name and differ by unit, which is why the parts are kept apart
		assertThat(pack("defra-2026").factors()
			.stream()
			.filter(factor -> "Gaseous fuels: Butane".equals(factor.name()))
			.map(FactorPacks.PackFactor::unit)).containsExactlyInAnyOrder("tonne", "litre", "kWh");
	}

	@Test
	void everyRowCitesThePublicationItComesFrom() {
		for (var pack : packs.all()) {
			for (var factor : pack.factors()) {
				assertThat(factor.sourcePublication()).as("%s / %s publication", pack.id(), factor.code()).isNotBlank();
				assertThat(factor.basis()).as("%s / %s basis", pack.id(), factor.code()).isNotNull();
			}
		}
		// a row cites its own publication, never its pack (spec 02.3). The Ghana pack is published in
		// 2025 and its grid rows are Ember's, so an Ember citation survives the Ember pack's removal:
		// dropping a pack from the catalogue never rewrites where a figure came from.
		var ghana2024 = row(pack("ghana"), "GHANA:grid:GHA:2024");
		assertThat(ghana2024.sourcePublication()).startsWith("Ember Yearly Electricity Data");
		assertThat(ghana2024.dataYear()).isEqualTo(2024);
		assertThat(ghana2024.citation(pack("ghana"))).contains("Ghana (GHA)").contains("data year 2024");
	}

	@Test
	void everyMontrealProtocolRowIsReportedOutsideTheScopes() {
		var defra = pack("defra-2026");
		var montreal = defra.factors()
			.stream()
			.filter(factor -> factor.code().contains("Montreal_protocol_products"))
			.toList();
		assertThat(montreal).hasSize(20);
		assertThat(montreal).allSatisfy(factor -> {
			assertThat(factor.basis()).isEqualTo(ReportingBasis.OUTSIDE_SCOPES_NON_KYOTO);
			assertThat(factor.defaultScope()).isEqualTo(Scope.SCOPE_1);
			assertThat(factor.defaultCategory()).isEqualTo(ActivityCategory.FUGITIVE_EMISSIONS);
			// the "Total emissions including non-Kyoto products" duplicates are dropped
			assertThat(factor.code()).contains("Emissions_including_only_non-Kyoto_products");
		});
		assertThat(montreal.stream().map(FactorPacks.PackFactor::name)).contains("HCFC-22 (R-22)", "CFC-11 (R-11)",
				"CFC-12 (R-12)");
		var hcfc22 = montreal.stream().filter(factor -> factor.name().equals("HCFC-22 (R-22)")).findFirst().orElseThrow();
		assertThat(hcfc22.kgCo2ePerUnit()).isEqualByComparingTo("1760");
		// the refrigerants pack left with spec 02.9, so DESNZ is now the only route to R-22, and it
		// has to stay outside the scopes: a Montreal Protocol gas in a scope 1 total breaks Chapter 4
		assertThat(defra.factors()
			.stream()
			.filter(factor -> factor.basis() == ReportingBasis.OUTSIDE_SCOPES_NON_KYOTO)
			.map(FactorPacks.PackFactor::code)).allSatisfy(code -> assertThat(code).contains("Montreal_protocol_products"));
	}

	@Test
	void bothSeededEditionsPassEveryPublicationRule() {
		for (var editionId : SHIPPED_ROW_COUNTS.keySet()) {
			var edition = editions.findById(editionId).orElseThrow();
			var findings = validation.validate(edition, rows.findAllByEditionIdOrderByOrdinalAsc(editionId));
			assertThat(findings).as("%s breaks %s", editionId, findings).isEmpty();
		}
	}

	@Test
	void noSeededRowReliesOnTheCitationLengthExemption() {
		// spec 02.5 rule 2: the citation an import builds fits ghg_emission_factors.source, so a published
		// edition never depends on the truncation spec 02.6 keeps as a backstop. The three rows that once
		// needed an exemption were in the sector packs and left with spec 02.9; V45's varchar(2000) leaves
		// the longest surviving citation, the Ghana T&D derivation, with room to spare.
		var overLong = new java.util.ArrayList<String>();
		var longest = 0;
		String longestCode = null;
		for (var editionId : SHIPPED_ROW_COUNTS.keySet()) {
			for (var row : rows.findAllByEditionIdOrderByOrdinalAsc(editionId)) {
				if (!FactorPackValidation.citationFits(row)) {
					overLong.add(editionId + " / " + row.getCode());
				}
				if (row.citation().length() > longest) {
					longest = row.citation().length();
					longestCode = editionId + " / " + row.getCode();
				}
			}
		}
		assertThat(overLong).as("rows relying on an exemption").isEmpty();
		assertThat(longest).as("the longest seeded citation, at %s", longestCode).isEqualTo(336);
		assertThat(longestCode).isEqualTo("ghana / GHANA:td-losses");
		assertThat(longest).isLessThanOrEqualTo(FactorPackValidation.MAX_CITATION_LENGTH);
	}

	@Test
	void anEditionAuthoredInTheConsoleIsNeverExemptFromTheApprover() {
		// the exemption is a column value V43 alone writes, so it can be asserted rather than assumed
		assertThat(editions.findAll())
			.filteredOn(edition -> FactorPackEdition.SEED_UNCHECKED.equals(edition.getProvenanceReview()))
			.extracting(FactorPackEdition::getEditionId)
			.containsExactlyInAnyOrderElementsOf(SHIPPED_ROW_COUNTS.keySet());
	}
}
