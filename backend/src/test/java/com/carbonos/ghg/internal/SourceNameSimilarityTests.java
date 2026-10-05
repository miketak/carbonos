package com.carbonos.ghg.internal;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/** The near-miss test behind the reconcile prompt (spec 04.10): prompts on a retyped name, not on a different source. */
class SourceNameSimilarityTests {

	@ParameterizedTest
	@CsvSource({ "Boiler LPG, boiler lpg", "Boiler LPG, Boiler LPG 2", "Boiler LPG, Boiler LPG No. 2",
			"Standby gensets, Standby genset", "Delivery fleet, Delivery fleets", "Grid supply, Plant grid supply",
			"LPG boiler, Boiler LPG", "Kiln 1, Kiln 2", "Camp generator diesel, Camp genset diesel" })
	void aRetypedOrSlightlyVariedNameIsClose(String a, String b) {
		assertThat(SourceNameSimilarity.isClose(a, b)).as("%s ~ %s", a, b).isTrue();
		assertThat(SourceNameSimilarity.isClose(b, a)).as("%s ~ %s", b, a).isTrue();
	}

	@ParameterizedTest
	@CsvSource({ "Boiler LPG, Diesel gensets", "Boiler LPG, Boiler diesel", "Grid supply, Camp grid supply backup",
			"Haul trucks, Light vehicles", "Standby gensets, Standby gensets fuel register 2025" })
	void aDifferentSourceIsNotClose(String a, String b) {
		assertThat(SourceNameSimilarity.isClose(a, b)).as("%s ~ %s", a, b).isFalse();
		assertThat(SourceNameSimilarity.isClose(b, a)).as("%s ~ %s", b, a).isFalse();
	}

	@ParameterizedTest
	@CsvSource({ "'  Boiler-LPG (No. 2) ', boiler lpg no 2", "STANDBY  gensets, standby gensets", "'', ''" })
	void normalizationDropsCaseAndPunctuation(String raw, String expected) {
		assertThat(SourceNameSimilarity.normalize(raw)).isEqualTo(expected);
	}

	@ParameterizedTest
	@CsvSource({ "kitten, sitting, 3", "genset, gensets, 1", "ab, ba, 1", "same, same, 0", "'', abc, 3" })
	void distanceCountsEditsAndTranspositions(String a, String b, int expected) {
		assertThat(SourceNameSimilarity.distance(a, b)).isEqualTo(expected);
	}

	@ParameterizedTest
	@CsvSource({ "Kiln, ''", "'', Kiln" })
	void anEmptyNameIsNeverClose(String a, String b) {
		assertThat(SourceNameSimilarity.isClose(a, b)).isFalse();
	}
}
