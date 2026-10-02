package com.carbonos.ghg.internal.web.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.stream.Stream;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import tools.jackson.databind.json.JsonMapper;

/** Kilograms to tonnes on the report, to three decimals half up: the TONNES vectors of calculation-vectors.json. */
class ReportResponseTonnesTest {

	record Vector(String id, String description, String input, String expected) {
		@Override
		public String toString() {
			return id + ": " + description;
		}
	}

	static Stream<Vector> tonnesVectors() {
		try (var in = ReportResponseTonnesTest.class.getResourceAsStream("/ghg/calculation-vectors.json")) {
			var vectors = new ArrayList<Vector>();
			for (var node : JsonMapper.builder().build().readTree(in).get("rounding")) {
				if ("TONNES".equals(node.get("stage").asString())) {
					vectors.add(new Vector(node.get("id").asString(), node.get("description").asString(),
							node.get("input").asString(), node.get("expected").asString()));
				}
			}
			return vectors.stream();
		}
		catch (IOException ex) {
			throw new UncheckedIOException(ex);
		}
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("tonnesVectors")
	void kilogramsBecomeTonnesAtThreeDecimals(Vector vector) {
		var got = ReportResponse.tonnes(new BigDecimal(vector.input()));
		assertThat(got).isEqualByComparingTo(vector.expected());
		assertThat(got.scale()).isEqualTo(3);
		assertThat(ReportResponse.tonnes(null)).isNull();
	}
}
