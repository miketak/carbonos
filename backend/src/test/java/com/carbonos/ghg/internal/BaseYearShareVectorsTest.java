package com.carbonos.ghg.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.stream.Stream;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import com.carbonos.ghg.internal.EngineVectors.BaseYearVector;
import com.carbonos.ghg.internal.EngineVectors.ShareVector;

/**
 * A recalculation candidate's share and the running sum since the base year
 * or the last recalculation (spec 06.1). The candidates here are built
 * outside a database, so {@code createdAt} is null and a declined candidate
 * counts as outstanding until a recalculation is recorded; the vectors are
 * written around one RECALCULATED decision for that reason.
 */
class BaseYearShareVectorsTest {

	static Stream<BaseYearVector> baseYearVectors() {
		return EngineVectors.load().baseYear().stream();
	}

	static Stream<ShareVector> shareVectors() {
		return EngineVectors.load().baseYearShares().stream();
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("baseYearVectors")
	void eachSequenceOfCandidatesWeighsAsTheHandCountGives(BaseYearVector vector) {
		var fixtures = new EngineFixtures();
		var inventory = fixtures.inventory("OPERATIONAL_CONTROL", "AR5", new EngineVectors.Period("2025-01-01", "2025-12-31"));
		var baseYear = new BaseYear(fixtures.organization, inventory, new BigDecimal(vector.inputs().thresholdPercent()),
				"First year with metered data", StructuralChangeConvention.TRANSACTION_DATE);
		var base = new BigDecimal(vector.inputs().baseTotalKg());
		BaseYearRecalculation last = null;
		var flagged = new java.util.ArrayList<BaseYearRecalculation>();
		for (var step : vector.inputs().steps()) {
			if (step.op().equals("flag")) {
				var percent = step.affectedKg() != null ? BaseYearService.percentOfBase(new BigDecimal(step.affectedKg()), base)
						: new BigDecimal(step.affectedPercent());
				last = baseYear.flag(RecalculationTrigger.valueOf(step.trigger()), step.what(), null, null, percent, "ama");
				flagged.add(last);
			}
			else {
				last.decide(RecalculationStatus.valueOf(step.status()), null, null, "ama");
			}
		}
		var want = vector.expected();
		assertThat(flagged).as("%s candidates", vector.id()).hasSameSizeAs(want.flags());
		for (int i = 0; i < flagged.size(); i++) {
			var got = flagged.get(i);
			var w = want.flags().get(i);
			assertThat(got.getAffectedPercent()).as("%s affected", vector.id()).isEqualByComparingTo(w.affectedPercent());
			assertThat(got.getCumulativePercent()).as("%s cumulative", vector.id()).isEqualByComparingTo(w.cumulativePercent());
			assertThat(got.isAboveThreshold()).as("%s above", vector.id()).isEqualTo(w.aboveThreshold());
			assertThat(got.getReason()).as("%s reason", vector.id()).isEqualTo(w.reason());
		}
		assertThat(baseYear.hasUnresolvedFlag()).isEqualTo(want.hasUnresolvedFlag());
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("shareVectors")
	void aShareOfTheBaseIsAPercentageToTwoDecimals(ShareVector vector) {
		var got = BaseYearService.percentOfBase(new BigDecimal(vector.inputs().partKg()), new BigDecimal(vector.inputs().baseKg()));
		assertThat(got).as("%s", vector.id()).isEqualByComparingTo(vector.expected());
	}
}
