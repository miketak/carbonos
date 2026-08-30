package com.carbonos.ghg.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

/** The dimensional unit registry: conversions, aliases, and the fail-safe boundaries. */
class UnitConverterTest {

	private final UnitConverter converter = new UnitConverter();

	@Test
	void convertsWithinTheSameDimension() {
		// 10,000 US-gallon -> litre (1 US gal = 3.785411784 L)
		assertThat(converter.convert(new BigDecimal("10000"), "US-gallon", "litre"))
			.isEqualByComparingTo("37854.11784");
		// 2 MWh -> kWh
		assertThat(converter.convert(new BigDecimal("2"), "MWh", "kWh")).isEqualByComparingTo("2000");
		// 3 short-ton -> tonne
		assertThat(converter.convert(new BigDecimal("3"), "short-ton", "tonne")).isEqualByComparingTo("2.72155422");
		// 5 mile -> km
		assertThat(converter.convert(new BigDecimal("5"), "mile", "km")).isEqualByComparingTo("8.04672");
	}

	@Test
	void identityConversionReturnsTheSameQuantity() {
		assertThat(converter.convert(new BigDecimal("42.5"), "litre", "litre")).isEqualByComparingTo("42.5");
	}

	@Test
	void normalizesAliasesAndCase() {
		assertThat(converter.dimensionOf("L")).contains(Dimension.VOLUME);
		assertThat(converter.dimensionOf("litres")).contains(Dimension.VOLUME);
		assertThat(converter.dimensionOf("KWH")).contains(Dimension.ENERGY);
		assertThat(converter.dimensionOf("m³")).contains(Dimension.VOLUME);
		// L and litre are the same unit, so converting between them is the identity
		assertThat(converter.convert(new BigDecimal("7"), "L", "litre")).isEqualByComparingTo("7");
	}

	@Test
	void cannotConvertAcrossDimensions() {
		assertThat(converter.canConvert("kg", "litre")).isFalse();
		assertThat(converter.canConvert("kWh", "km")).isFalse();
		// passenger-km is a distinct dimension from plain distance
		assertThat(converter.canConvert("passenger-km", "km")).isFalse();
	}

	@Test
	void cannotConvertUnknownUnits() {
		assertThat(converter.canConvert("widgets", "litre")).isFalse();
		assertThat(converter.dimensionOf("widgets")).isEmpty();
	}

	@Test
	void allSeededFactorUnitsAreRegistered() {
		// the eight distinct units used by the V4 factor seed
		for (var unit : new String[] { "m3", "litre", "kg", "kWh", "km", "passenger-km", "tonne" }) {
			assertThat(converter.dimensionOf(unit)).as("seeded unit '%s'", unit).isPresent();
		}
	}
}
