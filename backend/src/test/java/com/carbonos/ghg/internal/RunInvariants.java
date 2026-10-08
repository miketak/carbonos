package com.carbonos.ghg.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

import com.carbonos.ghg.internal.export.RunCsv;

/**
 * What holds for every run whatever its lines (specs 05.2, 07.7): the scopes
 * sum to the total, the lines sum to the total, every share is a share, every
 * stored kilogram carries three decimals, the gas rows times their potentials
 * foot to the total, and the CSV has one row per line.
 */
final class RunInvariants {

	private RunInvariants() {
	}

	static void assertAll(GhgRun run, BigDecimal gasFootingToleranceKg) {
		var gwp = run.getGwpSet();
		var scopes = run.getScope1KgCo2e().add(run.getScope2KgCo2e()).add(run.getScope3KgCo2e());
		assertThat(scopes).as("scopes sum to the total").isEqualByComparingTo(run.getTotalKgCo2e());
		var lines = run.scopedLines().stream().map(GhgRunLine::getKgCo2e).reduce(BigDecimal.ZERO, BigDecimal::add);
		assertThat(lines).as("the lines sum to the total").isEqualByComparingTo(run.getTotalKgCo2e());
		var gases = BigDecimal.ZERO;
		for (var line : run.getLines()) {
			assertThat(line.getWeight()).as("accounting share of %s", line.getRecordRef()).isBetween(BigDecimal.ZERO, BigDecimal.ONE);
			assertThat(line.getPeriodShare()).as("period share of %s", line.getRecordRef()).isBetween(BigDecimal.ZERO, BigDecimal.ONE);
			for (var kg : new BigDecimal[] { line.getKgCo2e(), line.getCo2Kg(), line.getCh4Kg(), line.getN2oKg(),
					line.getHfcsKgCo2e(), line.getPfcsKgCo2e(), line.getSf6Kg(), line.getNf3Kg(),
					line.getBiogenicCo2Kg(), line.getHfcsKg(), line.getPfcsKg() }) {
				assertThat(kg.scale()).as("a stored kilogram carries three decimals (%s)", line.getRecordRef()).isEqualTo(3);
			}
			if (line.getMarketBasedKgCo2e() != null) {
				assertThat(line.getMarketBasedKgCo2e().scale()).as("market-based kg of %s", line.getRecordRef()).isEqualTo(3);
			}
			if (!line.isInScopes()) {
				continue;
			}
			gases = gases.add(line.getCo2Kg())
				.add(line.getCh4Kg().multiply(gwp.ch4(line.isCh4Fossil())))
				.add(line.getN2oKg().multiply(gwp.n2o()))
				.add(line.getHfcsKgCo2e())
				.add(line.getPfcsKgCo2e())
				.add(line.getSf6Kg().multiply(gwp.sf6()))
				.add(line.getNf3Kg().multiply(gwp.nf3()))
				.add(line.co2eUnsplitKg());
		}
		assertThat(gases.subtract(run.getTotalKgCo2e()).abs())
			.as("the gas rows times their potentials foot to the total")
			.isLessThanOrEqualTo(gasFootingToleranceKg);
		assertThat(run.co2eUnsplitKg()).isEqualByComparingTo(
				run.scopedLines().stream().map(GhgRunLine::co2eUnsplitKg).reduce(BigDecimal.ZERO, BigDecimal::add));
		var rows = RunCsv.lines(run, DateTimeFormatter.ISO_LOCAL_DATE).strip().split("\n").length - 1;
		assertThat(rows).as("one CSV row per line").isEqualTo(run.getActivityCount());
	}
}
