package com.carbonos.ghg.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.stream.Stream;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import com.carbonos.ghg.internal.EngineVectors.ConversionVector;

/** A record's quantity in the factor's unit (spec 02.2): within a dimension, through a custom unit, or through a density. */
class ConversionVectorsTest {

	static Stream<ConversionVector> conversionVectors() {
		return EngineVectors.load().conversions().stream();
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("conversionVectors")
	void eachConversionGivesTheHandComputedQuantityAndNote(ConversionVector vector) {
		var fixtures = new EngineFixtures();
		var inputs = vector.inputs();
		var conversion = Conversion.of(fixtures.units(inputs.customUnits()), new BigDecimal(inputs.quantity()),
				inputs.from(), inputs.to(), fixtures.density(inputs.density()));
		var want = vector.expected();
		assertThat(conversion.isPresent()).as("%s converts", vector.id()).isEqualTo(want.present());
		if (!want.present()) {
			return;
		}
		var got = conversion.orElseThrow();
		assertThat(got.convertedQuantity().setScale(6, RoundingMode.HALF_UP)).as("%s quantity", vector.id())
			.isEqualByComparingTo(want.convertedQuantity());
		assertThat(got.factor().setScale(6, RoundingMode.HALF_UP)).as("%s factor", vector.id())
			.isEqualByComparingTo(want.factor());
		assertThat(got.note()).as("%s note", vector.id()).isEqualTo(want.note());
		assertThat(got.viaDensity()).as("%s via density", vector.id()).isEqualTo(want.viaDensity());
	}
}
