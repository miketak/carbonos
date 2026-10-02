package com.carbonos.ghg.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

/** A refrigerant blend's composition and its CO2e per kilogram under a GWP set (spec 07.4). */
class BlendCompositionTest {

	@Test
	void aCompositionPricesUnderEitherSet() {
		var blend = BlendComposition.parse("HFC-32:0.5,HFC-125:0.5");
		assertThat(blend.sumsToOne()).isTrue();
		assertThat(blend.kgCo2ePerKg(GwpSet.AR5)).isEqualByComparingTo("1923.5");
		assertThat(blend.kgCo2ePerKg(GwpSet.AR6)).isEqualByComparingTo("2255.5");
		assertThat(blend.describe()).isEqualTo("50% HFC-32, 50% HFC-125");
	}

	@Test
	void fractionsOffByMoreThanAThousandthDoNotSumToOne() {
		assertThat(BlendComposition.parse("HFC-32:0.5,HFC-125:0.6").sumsToOne()).isFalse();
		assertThat(BlendComposition.parse("HFC-32:0.5,HFC-125:0.4995").sumsToOne()).isTrue();
	}

	@Test
	void anUnknownSpeciesHasNoFigureAndABlankCompositionIsNone() {
		assertThat(BlendComposition.parse("R-999:1").kgCo2ePerKg(GwpSet.AR5)).isNull();
		assertThat(BlendComposition.parse(" ")).isNull();
		assertThatThrownBy(() -> BlendComposition.parse("HFC-32")).isInstanceOf(IllegalArgumentException.class);
	}
}
