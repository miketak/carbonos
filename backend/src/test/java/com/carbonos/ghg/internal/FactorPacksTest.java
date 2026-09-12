package com.carbonos.ghg.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import tools.jackson.databind.json.JsonMapper;

/**
 * What the shipped packs must contain (specs 02.3 and 02.4): every row cites
 * the publication it comes from, Montreal Protocol rows report outside the
 * scopes, the mining pack carries the purchased-goods rows its card promises,
 * and the oil and gas pack carries flaring rows with the table they come from.
 */
class FactorPacksTest {

	private final FactorPacks packs = new FactorPacks(JsonMapper.builder().build());

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
}
