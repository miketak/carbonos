package com.carbonos.ghg.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import com.carbonos.TestcontainersConfiguration;

import tools.jackson.databind.json.JsonMapper;

/**
 * What the seeded editions must contain (specs 02.3, 02.4 and 02.5). The packs
 * are read from the catalogue {@code V43} seeded, and the JSON files that seed
 * came from are the oracle: every row must arrive with the values, the
 * provenance and the taxonomy the file states. Every row cites the publication
 * it comes from, Montreal Protocol rows report outside the scopes, the mining
 * pack carries the purchased-goods rows its card promises, and the oil and gas
 * pack carries flaring rows with the table they come from.
 *
 * <p>Its last assertion is the guard the authoring phase adds: all ten pass
 * every publication rule of {@link FactorPackValidation}, so the rules and the
 * corpus we shipped cannot drift apart. Three rows of two seeded editions carry
 * a derivation narrative longer than the citation column, which the
 * {@code SEED_UNCHECKED} exemption covers and this class names one by one.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class SeededFactorPackEditionsTest {

	/** The rows each shipped pack file carries, which the seeded editions must match exactly. */
	private static final Map<String, Integer> SHIPPED_ROW_COUNTS = Map.of("defra-2026", 1868, "epa-hub-2025", 548,
			"ember-grid-2025", 141, "sector-construction", 80, "sector-oil-and-gas", 74, "refrigerants-ar5", 56,
			"sector-mining", 56, "ghana", 7, "ipcc-2006-process", 5, "nga-2024-explosives", 1);

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

	/** The shipped JSON files, still on the classpath, read as the oracle the seed was built from. */
	private static Map<String, FactorPacks.Pack> shippedFiles() {
		var mapper = JsonMapper.builder().build();
		var loaded = new LinkedHashMap<String, FactorPacks.Pack>();
		try {
			for (var resource : new PathMatchingResourcePatternResolver()
				.getResources("classpath:factor-packs/*.json")) {
				try (var in = resource.getInputStream()) {
					var pack = mapper.readValue(in, FactorPacks.Pack.class);
					loaded.put(pack.id(), pack);
				}
			}
		}
		catch (Exception ex) {
			throw new AssertionError("Could not read the shipped pack files", ex);
		}
		return loaded;
	}

	private static void assertSameValue(String as, BigDecimal actual, BigDecimal expected) {
		if (expected == null) {
			assertThat(actual).as(as).isNull();
		}
		else {
			assertThat(actual).as(as).isNotNull().isEqualByComparingTo(expected);
		}
	}

	@Test
	void theTenSeededEditionsCarryTheRowsTheShippedFilesCarried() {
		var shipped = shippedFiles();
		assertThat(shipped.keySet()).containsExactlyInAnyOrderElementsOf(SHIPPED_ROW_COUNTS.keySet());
		assertThat(packs.all().stream().map(FactorPacks.Pack::id))
			.containsExactlyInAnyOrderElementsOf(SHIPPED_ROW_COUNTS.keySet());
		// the header projection counts the same rows without assembling them
		assertThat(packs.headers()).allSatisfy(header -> assertThat(header.factorCount()).as(header.id())
			.isEqualTo(SHIPPED_ROW_COUNTS.get(header.id())));
		assertThat(packs.headers().stream().mapToInt(FactorPacks.PackHeader::factorCount).sum()).isEqualTo(2836);
		for (var entry : SHIPPED_ROW_COUNTS.entrySet()) {
			var seeded = pack(entry.getKey());
			var file = shipped.get(entry.getKey());
			assertThat(seeded.factors()).as(entry.getKey()).hasSize(entry.getValue());
			assertThat(seeded.name()).isEqualTo(file.name());
			assertThat(seeded.source()).isEqualTo(file.source());
			assertThat(seeded.sourceUrl()).isEqualTo(file.sourceUrl());
			assertThat(seeded.publicationYear()).isEqualTo(file.publicationYear());
			assertThat(seeded.gwpBasis()).isEqualTo(file.gwpBasis());
			assertThat(seeded.license()).isEqualTo(file.license());
			assertThat(seeded.retrieved()).isEqualTo(file.retrieved());
			assertThat(seeded.notes()).isEqualTo(file.notes());
			// every row, in the file's order, with the file's values
			for (int i = 0; i < file.factors().size(); i++) {
				var expected = file.factors().get(i);
				var actual = seeded.factors().get(i);
				var as = entry.getKey() + " / " + expected.code();
				assertThat(actual.code()).as(as).isEqualTo(expected.code());
				assertThat(actual.name()).as(as).isEqualTo(expected.name());
				assertThat(actual.defaultScope()).as(as).isEqualTo(expected.defaultScope());
				assertThat(actual.defaultCategory()).as(as).isEqualTo(expected.defaultCategory());
				assertThat(actual.scopeAgnostic()).as(as).isEqualTo(expected.scopeAgnostic());
				assertThat(actual.unit()).as(as).isEqualTo(expected.unit());
				assertSameValue(as, actual.kgCo2ePerUnit(), expected.kgCo2ePerUnit());
				assertSameValue(as, actual.co2(), expected.co2());
				assertSameValue(as, actual.ch4(), expected.ch4());
				assertThat(actual.ch4Fossil()).as(as).isEqualTo(expected.ch4Fossil());
				assertSameValue(as, actual.n2o(), expected.n2o());
				assertSameValue(as, actual.hfcsKg(), expected.hfcsKg());
				assertSameValue(as, actual.pfcsKg(), expected.pfcsKg());
				assertSameValue(as, actual.sf6(), expected.sf6());
				assertSameValue(as, actual.nf3(), expected.nf3());
				assertSameValue(as, actual.biogenicCo2(), expected.biogenicCo2());
				assertThat(actual.blendComposition()).as(as).isEqualTo(expected.blendComposition());
				assertThat(actual.blendGwpSource()).as(as).isEqualTo(expected.blendGwpSource());
				assertThat(actual.dataYear()).as(as).isEqualTo(expected.dataYear());
				assertThat(actual.approved()).as(as).isEqualTo(expected.approved());
				assertThat(actual.notes()).as(as).isEqualTo(expected.notes());
				assertThat(actual.sourcePublication()).as(as).isEqualTo(expected.sourcePublication());
				assertThat(actual.sourceUrl()).as(as).isEqualTo(expected.sourceUrl());
				assertThat(actual.publicationYear()).as(as).isEqualTo(expected.publicationYear());
				assertThat(actual.basis()).as(as).isEqualTo(expected.basis());
				// the file's one concatenation is three columns here, and they rejoin to it
				assertThat(actual.sourcePath()).as(as).isEqualTo(expected.sourceDetail());
				assertThat(actual.citation(seeded)).as(as).isEqualTo(expected.citation(file));
			}
		}
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
		// an EPA Hub row: the third part is the detail, not part of the activity
		var anthracite = row(pack("epa-hub-2025"),
				"EPA:Stationary_combustion:Anthracite:Coal_and_Coke_per_short_ton:short_ton");
		assertThat(anthracite.sourceCategory()).isEqualTo("Stationary combustion");
		assertThat(anthracite.sourceActivity()).isEqualTo("Anthracite");
		assertThat(anthracite.sourceDetail()).isEqualTo("Coal and Coke; per short ton");
		// a hand-written derivation cites a document rather than a table row: the citation is the detail
		var clinker = row(pack("ipcc-2006-process"), "IPCC:2006:clinker");
		assertThat(clinker.sourceCategory()).isNull();
		assertThat(clinker.sourceActivity()).isNull();
		assertThat(clinker.sourceDetail()).contains("Volume 3, Chapter 2");
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
		// a sector pack is a selection: the IPCC lime row keeps IPCC's citation and year, not the pack's 2026
		var lime = row(pack("sector-mining"), "IPCC:2006:lime-high-calcium");
		assertThat(lime.sourcePublication()).startsWith("IPCC 2006 Guidelines");
		assertThat(lime.publicationYear()).isEqualTo(2006);
		assertThat(lime.dataYear()).isEqualTo(2006);
		assertThat(lime.citation(pack("sector-mining"))).contains("Volume 3, Chapter 2, Table 2.4");
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
		// the refrigerants pack and both sector packs select the HCFC-22 row
		for (var id : List.of("refrigerants-ar5", "sector-mining", "sector-oil-and-gas")) {
			assertThat(pack(id).factors().stream().map(FactorPacks.PackFactor::name)).as(id).contains("HCFC-22 (R-22)");
		}
		// no row outside the scopes leaks into a pack under a Kyoto-gas name
		assertThat(pack("refrigerants-ar5").factors()
			.stream()
			.filter(factor -> factor.basis() == ReportingBasis.OUTSIDE_SCOPES_NON_KYOTO)
			.map(FactorPacks.PackFactor::name)).containsExactly("HCFC-22 (R-22)");
	}

	@Test
	void theMiningPackCarriesThePurchasedGoodsRowsItsCardPromises() {
		var mining = pack("sector-mining");
		var templates = List.of("TEMPLATE:supplier:quicklime", "TEMPLATE:supplier:cement",
				"TEMPLATE:supplier:sodium-cyanide", "TEMPLATE:supplier:grinding-media");
		for (var code : templates) {
			var template = row(mining, code);
			assertThat(template.approved()).as(code).isFalse();
			assertThat(template.kgCo2ePerUnit()).as(code).isEqualByComparingTo("0");
			assertThat(template.unit()).as(code).isEqualTo("tonne");
			assertThat(template.defaultScope()).as(code).isEqualTo(Scope.SCOPE_3);
			assertThat(template.defaultCategory()).as(code).isEqualTo(ActivityCategory.PURCHASED_GOODS_SERVICES);
			assertThat(template.notes()).as(code).contains("the run is blocked");
		}
		var concrete = row(mining, "DEFRA:Material_use:Construction_Concrete:Primary_material_production:tonnes");
		assertThat(concrete.kgCo2ePerUnit()).isEqualByComparingTo("118.80307");
		assertThat(concrete.defaultCategory()).isEqualTo(ActivityCategory.PURCHASED_GOODS_SERVICES);
		var metals = row(mining, "DEFRA:Material_use:Construction_Metals:Primary_material_production:tonnes");
		assertThat(metals.kgCo2ePerUnit()).isEqualByComparingTo("3821.94858");
		assertThat(metals.notes()).contains("construction-metal average").contains("proxy");
		// the land-clearing row, unapproved, per hectare, cited by table
		var clearing = row(mining, "IPCC:2006:land-clearing-tropical-moist-forest");
		assertThat(clearing.approved()).isFalse();
		assertThat(clearing.unit()).isEqualTo("hectare");
		assertThat(clearing.kgCo2ePerUnit()).isEqualByComparingTo("555602.666667");
		assertThat(clearing.sourceDetail()).contains("Table 4.7").contains("Table 4.4").contains("Table 4.3");
		// the card says what the pack holds and what it does not
		assertThat(mining.notes()).contains("supplier-factor templates")
			.contains("Tailings and mine-water treatment have no published factor");
	}

	@Test
	void theOilAndGasPackCarriesFlaringRowsWithTheTableTheyComeFrom() {
		var oilgas = pack("sector-oil-and-gas");
		var gas = row(oilgas, "IPCC:2006:flaring-gas-production");
		assertThat(gas.approved()).isFalse();
		assertThat(gas.unit()).isEqualTo("1000m3");
		assertThat(gas.co2()).isEqualByComparingTo("1.2");
		assertThat(gas.ch4()).isEqualByComparingTo("0.00076");
		assertThat(gas.n2o()).isEqualByComparingTo("0.000021");
		assertThat(gas.sourceDetail()).contains("Table 4.2.4").contains("1.B.2.b.ii").contains("Gg per 10^6 m3");
		var oil = row(oilgas, "IPCC:2006:flaring-oil-production");
		assertThat(oil.unit()).isEqualTo("m3");
		assertThat(oil.co2()).isEqualByComparingTo("41.0");
		assertThat(oil.sourceDetail()).contains("Table 4.2.4").contains("1.B.2.a.ii").contains("Gg per 10^3 m3");
		var flared = row(oilgas, "IPCC:2006:flaring-per-m3-flared");
		assertThat(flared.co2()).isEqualByComparingTo("2.0");
		assertThat(flared.ch4()).isEqualByComparingTo("0.012");
		assertThat(flared.sourceDetail()).contains("Table 4.2.5, footnote (e)").contains("98%");
		var proxy = row(oilgas, "PROXY:2026:flared-gas-as-natural-gas");
		assertThat(proxy.approved()).isFalse();
		assertThat(proxy.kgCo2ePerUnit()).isEqualByComparingTo("2.02633");
		assertThat(proxy.notes()).contains("assumes complete combustion");
		assertThat(oilgas.notes()).contains("Flaring ships four unapproved rows");
	}

	@Test
	void allTenSeededEditionsPassEveryPublicationRule() {
		for (var editionId : SHIPPED_ROW_COUNTS.keySet()) {
			var edition = editions.findById(editionId).orElseThrow();
			var findings = validation.validate(edition, rows.findAllByEditionIdOrderByOrdinalAsc(editionId));
			assertThat(findings).as("%s breaks %s", editionId, findings).isEmpty();
		}
	}

	@Test
	void onlyThreeSeededRowsRelyOnTheCitationLengthExemption() {
		// spec 02.5 rule 2: the citation an import builds fits ghg_emission_factors.source, which is
		// varchar(500), so a published edition never depends on the truncation spec 02.6 keeps as a
		// backstop. Three rows shipped before the catalogue existed do, and V43 is checksummed by Flyway,
		// so SEED_UNCHECKED covers them. Naming them here is what keeps a fourth from joining quietly.
		var overLong = new java.util.ArrayList<String>();
		for (var editionId : SHIPPED_ROW_COUNTS.keySet()) {
			for (var row : rows.findAllByEditionIdOrderByOrdinalAsc(editionId)) {
				if (!FactorPackValidation.citationFits(row)) {
					overLong.add(editionId + " / " + row.getCode());
				}
			}
		}
		assertThat(overLong).containsExactlyInAnyOrder(
				"sector-mining / IPCC:2006:land-clearing-tropical-moist-forest",
				"sector-oil-and-gas / IPCC:2006:flaring-gas-production",
				"sector-oil-and-gas / IPCC:2006:flaring-per-m3-flared");
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
