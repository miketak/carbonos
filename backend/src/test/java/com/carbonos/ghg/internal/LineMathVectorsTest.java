package com.carbonos.ghg.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import com.carbonos.ghg.internal.EngineVectors.ExpectedDerived;
import com.carbonos.ghg.internal.EngineVectors.ExpectedLine;
import com.carbonos.ghg.internal.EngineVectors.LineVector;

/**
 * Every line vector of {@code calculation-vectors.json} reproduced through
 * {@link LineMath} (specs 04.2, 04.7, 07.3, 07.7): the conversion, the two
 * shares, the kg CO2e and each gas column, the market-based side, the derived
 * category 3 lines, then the run's totals and its invariants.
 */
class LineMathVectorsTest {

	static Stream<LineVector> lineVectors() {
		return EngineVectors.load().lines().stream();
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("lineVectors")
	void eachLineVectorReproducesItsHandComputedFigures(LineVector vector) {
		var fixtures = new EngineFixtures();
		var inputs = vector.inputs();
		var inventory = fixtures.inventory(inputs.approach(), inputs.gwpSet(), inputs.inventoryPeriod());
		if (inputs.residualMix() != null) {
			inventory.setResidualMix(inputs.residualMix().available(), EngineVectors.decimal(inputs.residualMix().kgCo2ePerKwh()));
		}
		var units = fixtures.units(inputs.customUnits());
		var gwp = GwpSet.valueOf(inputs.gwpSet());
		var run = new GhgRun(inventory, 1, "Run 001", "test");
		Map<UUID, MarketFactor> instruments = new HashMap<>();
		Map<UUID, BigDecimal> remainingCoverage = new HashMap<>();
		for (var spec : inputs.instruments() == null ? List.<EngineVectors.Instrument>of() : inputs.instruments()) {
			var instrument = fixtures.instrument(inventory, spec);
			instruments.put(instrument.getFacility().getId(), instrument);
			remainingCoverage.put(instrument.getFacility().getId(), instrument.getCoveredKwh());
		}
		var lines = new ArrayList<GhgRunLine>();
		var derivedByLine = new HashMap<GhgRunLine, List<GhgRunLine>>();
		for (var spec : inputs.records()) {
			var assignment = fixtures.assignment(inventory, spec);
			var facilityId = assignment.getActivity().getFacility().getId();
			var primary = LineMath.primaryLine(run, assignment, EngineFixtures.coverage(spec.coverage()), units, gwp,
					instruments.get(facilityId), remainingCoverage, null);
			run.addLine(primary.line());
			lines.add(primary.line());
			var derived = new ArrayList<GhgRunLine>();
			for (var ruleSpec : spec.upstreamRules() == null ? List.<EngineVectors.Rule>of() : spec.upstreamRules()) {
				var rule = new UpstreamRule(inventory, assignment.getEmissionFactor(), fixtures.factor(ruleSpec.upstream()),
						UpstreamRuleKind.valueOf(ruleSpec.kind()), "test");
				var line = LineMath.derivedLine(run, assignment, primary, rule, units, gwp);
				run.addLine(line);
				derived.add(line);
			}
			derivedByLine.put(primary.line(), derived);
		}

		var expected = vector.expected();
		assertThat(lines).hasSameSizeAs(expected.records());
		for (int i = 0; i < lines.size(); i++) {
			assertLine(vector.id(), lines.get(i), expected.records().get(i), derivedByLine.get(lines.get(i)));
		}
		var want = expected.run();
		assertThat(run.getTotalKgCo2e()).as("%s total", vector.id()).isEqualByComparingTo(want.totalKgCo2e());
		assertThat(run.getScope1KgCo2e()).as("%s scope 1", vector.id()).isEqualByComparingTo(want.scope1KgCo2e());
		assertThat(run.getScope2KgCo2e()).as("%s scope 2", vector.id()).isEqualByComparingTo(want.scope2KgCo2e());
		assertThat(run.getScope3KgCo2e()).as("%s scope 3", vector.id()).isEqualByComparingTo(want.scope3KgCo2e());
		assertThat(run.getScope2MarketBasedKgCo2e()).as("%s market-based scope 2", vector.id())
			.isEqualByComparingTo(want.scope2MarketBasedKgCo2e());
		assertThat(name(run.getScope2MarketBasis())).as("%s market basis", vector.id()).isEqualTo(want.scope2MarketBasis());
		assertThat(run.getCo2Kg()).as("%s CO2", vector.id()).isEqualByComparingTo(want.co2Kg());
		assertThat(run.getCh4Kg()).as("%s CH4", vector.id()).isEqualByComparingTo(want.ch4Kg());
		assertThat(run.getCh4FossilKg()).as("%s fossil CH4", vector.id()).isEqualByComparingTo(want.ch4FossilKg());
		assertThat(run.getN2oKg()).as("%s N2O", vector.id()).isEqualByComparingTo(want.n2oKg());
		assertThat(run.getHfcsKgCo2e()).as("%s HFCs", vector.id()).isEqualByComparingTo(want.hfcsKgCo2e());
		assertThat(run.getBiogenicCo2Kg()).as("%s biogenic", vector.id()).isEqualByComparingTo(want.biogenicCo2Kg());
		assertThat(run.co2eUnsplitKg()).as("%s unsplit", vector.id()).isEqualByComparingTo(want.co2eUnsplitKg());
		assertThat(run.getActivityCount()).as("%s lines", vector.id()).isEqualTo(want.activityCount());
		assertThat(run.outsideScopesLines()).as("%s outside the scopes", vector.id()).hasSize(want.outsideScopesLines());
		if (want.assessmentReports() != null) {
			assertThat(run.assessmentReports()).as("%s assessment reports", vector.id()).isEqualTo(want.assessmentReports());
		}
		RunInvariants.assertAll(run, new BigDecimal(want.gasFootingToleranceKg()));
	}

	private static void assertLine(String id, GhgRunLine line, ExpectedLine want, List<GhgRunLine> derived) {
		var at = id + " " + want.ref();
		assertThat(line.getRecordRef()).isEqualTo(want.ref());
		assertThat(line.getKgCo2e()).as("%s kg CO2e", at).isEqualByComparingTo(want.kgCo2e());
		assertThat(line.getCo2Kg()).as("%s CO2", at).isEqualByComparingTo(want.co2Kg());
		assertThat(line.getCh4Kg()).as("%s CH4", at).isEqualByComparingTo(want.ch4Kg());
		assertThat(line.getN2oKg()).as("%s N2O", at).isEqualByComparingTo(want.n2oKg());
		assertThat(line.getHfcsKgCo2e()).as("%s HFCs CO2e", at).isEqualByComparingTo(want.hfcsKgCo2e());
		assertThat(line.getSf6Kg()).as("%s SF6", at).isEqualByComparingTo(want.sf6Kg());
		assertThat(line.getBiogenicCo2Kg()).as("%s biogenic", at).isEqualByComparingTo(want.biogenicCo2Kg());
		assertThat(line.getHfcsKg()).as("%s HFC mass", at).isEqualByComparingTo(want.hfcsKg());
		assertThat(line.getBlendGwpSource()).as("%s blend basis", at).isEqualTo(want.blendGwpSource());
		assertThat(line.isCh4Fossil()).as("%s fossil methane", at).isEqualTo(want.ch4Fossil());
		assertThat(six(line.getConvertedQuantity())).as("%s converted quantity", at).isEqualByComparingTo(want.convertedQuantity());
		assertThat(six(line.getConversionFactor())).as("%s conversion factor", at).isEqualByComparingTo(want.conversionFactor());
		assertThat(line.getConversionNote()).as("%s conversion note", at).isEqualTo(want.conversionNote());
		assertThat(line.getKgCo2ePerUnit()).as("%s kg CO2e per unit", at).isEqualByComparingTo(want.kgCo2ePerUnit());
		assertThat(line.getWeight()).as("%s accounting share", at).isEqualByComparingTo(want.weight());
		assertThat(line.getPeriodShare()).as("%s period share", at).isEqualByComparingTo(want.periodShare());
		assertThat(line.getPeriodNote()).as("%s period note", at).isEqualTo(want.periodNote());
		assertThat(line.getScope().name()).as("%s scope", at).isEqualTo(want.scope());
		assertThat(line.getCategory().name()).as("%s category", at).isEqualTo(want.category());
		assertThat(line.getReportingBasis().name()).as("%s reporting basis", at).isEqualTo(want.reportingBasis());
		assertThat(line.isUnsplit()).as("%s unsplit", at).isEqualTo(want.unsplit());
		if (want.market() == null) {
			assertThat(line.getMarketBasedKgCo2e()).as("%s has no market-based side", at).isNull();
		}
		else {
			var market = want.market();
			assertThat(line.getMarketBasedKgCo2e()).as("%s market-based kg", at).isEqualByComparingTo(market.kgCo2e());
			assertThat(name(line.getMarketInstrument())).as("%s instrument", at).isEqualTo(market.instrument());
			assertThat(line.getMarketCoveredKwh()).as("%s covered kWh", at).isEqualByComparingTo(market.coveredKwh());
			assertThat(line.getMarketBalanceKwh()).as("%s balance kWh", at).isEqualByComparingTo(market.balanceKwh());
			assertThat(name(line.getMarketBalanceBasis())).as("%s balance basis", at).isEqualTo(market.balanceBasis());
			if (market.note() != null) {
				assertThat(line.getMarketNote()).as("%s market note", at).isEqualTo(market.note());
			}
			if (market.noteStartsWith() != null) {
				assertThat(line.getMarketNote()).as("%s market note", at).startsWith(market.noteStartsWith());
			}
		}
		var wantDerived = want.derived() == null ? List.<ExpectedDerived>of() : want.derived();
		assertThat(derived).as("%s derived lines", at).hasSameSizeAs(wantDerived);
		for (int i = 0; i < derived.size(); i++) {
			var d = derived.get(i);
			var w = wantDerived.get(i);
			assertThat(d.isDerived()).isTrue();
			assertThat(d.getDerivedFromLineId()).isEqualTo(line.getId());
			assertThat(d.getDerivedKind().name()).isEqualTo(w.kind());
			assertThat(d.getKgCo2e()).as("%s derived kg", at).isEqualByComparingTo(w.kgCo2e());
			assertThat(d.getCo2Kg()).as("%s derived CO2", at).isEqualByComparingTo(w.co2Kg());
			assertThat(d.getScope().name()).isEqualTo(w.scope());
			assertThat(d.getCategory().name()).isEqualTo(w.category());
			assertThat(d.getDerivedNote()).as("%s derived note", at).isEqualTo(w.note());
			assertThat(six(d.getConversionFactor())).as("%s derived conversion factor", at).isEqualByComparingTo(w.conversionFactor());
			assertThat(d.getMarketBasedKgCo2e()).isNull();
			assertThat(d.getLeaseType()).isNull();
			assertThat(d.getWeight()).isEqualByComparingTo(line.getWeight());
			assertThat(d.getPeriodShare()).isEqualByComparingTo(line.getPeriodShare());
		}
	}

	private static BigDecimal six(BigDecimal value) {
		return value.setScale(6, RoundingMode.HALF_UP);
	}

	private static String name(Enum<?> value) {
		return value == null ? null : value.name();
	}

	@Test
	void thePeriodShareIsExactlyOneWhenEveryDayIsCovered() {
		var share = LineMath.periodShare(new BoundaryVersion.Coverage(BigDecimal.ONE, 31, 31));
		assertThat(share).isSameAs(BigDecimal.ONE);
		assertThat(LineMath.period(EngineFixtures.date("2025-03-01"), EngineFixtures.date("2025-03-31"),
				new BoundaryVersion.Coverage(BigDecimal.ONE, 31, 31)).note()).isNull();
	}

	@Test
	void theAccountingShareIsNothingWhenNoDayIsCovered() {
		var coverage = new BoundaryVersion.Coverage(new BigDecimal("0.4"), 0, 30);
		assertThat(LineMath.accountingShare(coverage)).isEqualByComparingTo("0");
		assertThat(LineMath.periodShare(coverage)).isEqualByComparingTo("0");
	}

	@Test
	void aGasCarriesTheSameTwoSharesAsTheKgCo2e() {
		var counted = new BigDecimal("500");
		assertThat(LineMath.gas(counted, new BigDecimal("2.5"), new BigDecimal("0.4"))).isEqualByComparingTo("500.000");
		assertThat(LineMath.gas(counted, new BigDecimal("0.0001"), new BigDecimal("0.4"))).isEqualByComparingTo("0.020");
	}
}
