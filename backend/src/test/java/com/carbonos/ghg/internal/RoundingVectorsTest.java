package com.carbonos.ghg.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.stream.Stream;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import com.carbonos.ghg.internal.EngineVectors.RoundingVector;

/**
 * Where the engine rounds and how: a line's kilograms to three decimals half
 * up, a period share to six, a base-year share to two. The tonnes stage is in
 * {@code web.dto.ReportResponseTonnesTest}, next to the method it checks.
 */
class RoundingVectorsTest {

	static Stream<RoundingVector> roundingVectors() {
		return EngineVectors.load().rounding().stream().filter(v -> !v.stage().equals("TONNES"));
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("roundingVectors")
	void eachStageRoundsAsTheVectorSays(RoundingVector vector) {
		var expected = new BigDecimal(vector.expected());
		var got = switch (vector.stage()) {
			case "LINE_KG" -> LineMath.round(new BigDecimal(vector.input()));
			case "PERIOD_SHARE" -> LineMath.periodShare(new BoundaryVersion.Coverage(BigDecimal.ONE, vector.coveredDays(), vector.totalDays()));
			case "BASE_YEAR_PERCENT" -> BaseYearService.percentOfBase(new BigDecimal(vector.partKg()), new BigDecimal(vector.baseKg()));
			default -> throw new IllegalArgumentException("unknown stage " + vector.stage());
		};
		assertThat(got).as("%s", vector.id()).isEqualByComparingTo(expected);
		assertThat(got.scale()).as("%s scale", vector.id()).isEqualTo(expected.scale());
	}
}
