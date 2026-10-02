package com.carbonos.ghg.internal;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

/**
 * The hand-computed test vectors of the calculation engine
 * ({@code src/test/resources/ghg/calculation-vectors.json}): known inputs with
 * the figures the specs' formulas give, each with the arithmetic that produced
 * it. Decimals travel as strings so no digit is lost; the tests compare them
 * with {@code compareTo}, or to six decimals where the engine keeps more.
 */
final class EngineVectors {

	private EngineVectors() {
	}

	record Period(String start, String end) {
	}

	record Factor(String name, String scope, String category, String unit, String kgCo2ePerUnit, String co2, String ch4,
			Boolean ch4Fossil, String n2o, String hfcsKg, String sf6, String biogenicCo2, String blendComposition,
			String blendGwpSource, String reportingBasis) {
	}

	record Coverage(String share, long coveredDays, long totalDays) {
	}

	record Density(String material, String kgPerLitre, boolean typical) {
	}

	record CustomUnit(String code, String base, String factor) {
	}

	record Rule(String upstream, String kind) {
	}

	record Record(int ref, String activityType, String facility, String quantity, String unit, Period period,
			String factor, Coverage coverage, Density density, List<Rule> upstreamRules) {
	}

	record Instrument(String facility, String type, String kgCo2ePerKwh, String coveredKwh, String periodStart,
			String periodEnd, Boolean meetsQualityCriteria) {
	}

	record ResidualMix(Boolean available, String kgCo2ePerKwh) {
	}

	record LineInputs(String gwpSet, String approach, Period inventoryPeriod, List<Record> records,
			List<Instrument> instruments, ResidualMix residualMix, List<CustomUnit> customUnits) {
	}

	record ExpectedMarket(String kgCo2e, String instrument, String coveredKwh, String balanceKwh, String balanceBasis,
			String note, String noteStartsWith) {
	}

	record ExpectedDerived(String upstream, String kind, String kgCo2e, String co2Kg, String scope, String category,
			String note, String conversionFactor) {
	}

	record ExpectedLine(String ref, String kgCo2e, String co2Kg, String ch4Kg, String n2oKg, String hfcsKgCo2e,
			String sf6Kg, String biogenicCo2Kg, String hfcsKg, String blendGwpSource, boolean ch4Fossil,
			String convertedQuantity, String conversionFactor, String conversionNote, String kgCo2ePerUnit,
			String weight, String periodShare, String periodNote, String scope, String category,
			String reportingBasis, boolean unsplit, ExpectedMarket market, List<ExpectedDerived> derived) {
	}

	record ExpectedRun(String totalKgCo2e, String scope1KgCo2e, String scope2KgCo2e, String scope3KgCo2e,
			String scope2MarketBasedKgCo2e, String scope2MarketBasis, String co2Kg, String ch4Kg, String ch4FossilKg,
			String n2oKg, String hfcsKgCo2e, String biogenicCo2Kg, String co2eUnsplitKg, int activityCount,
			int outsideScopesLines, String gasFootingToleranceKg, List<String> assessmentReports) {
	}

	record LineExpected(List<ExpectedLine> records, ExpectedRun run) {
	}

	record LineVector(String id, String description, String source, LineInputs inputs, LineExpected expected) {
		@Override
		public String toString() {
			return id + ": " + description;
		}
	}

	record ProRatingInputs(Period inventoryPeriod, Period record, String windowFrom, String windowTo) {
	}

	record ProRatingExpected(long days, long coveredDays, String periodShare, String periodNote) {
	}

	record ProRatingVector(String id, String description, String source, ProRatingInputs inputs,
			ProRatingExpected expected) {
		@Override
		public String toString() {
			return id + ": " + description;
		}
	}

	record ProRatingSum(String id, String description, List<String> vectors, String expected) {
		@Override
		public String toString() {
			return id + ": " + description;
		}
	}

	record ConversionInputs(String quantity, String from, String to, Density density, List<CustomUnit> customUnits) {
	}

	record ConversionExpected(boolean present, String convertedQuantity, String factor, String note,
			Boolean viaDensity) {
	}

	record ConversionVector(String id, String description, String source, ConversionInputs inputs,
			ConversionExpected expected) {
		@Override
		public String toString() {
			return id + ": " + description;
		}
	}

	record Step(String op, String trigger, String what, String affectedKg, String affectedPercent, String status) {
	}

	record BaseYearInputs(String thresholdPercent, String baseTotalKg, List<Step> steps) {
	}

	record ExpectedFlag(String affectedPercent, String cumulativePercent, boolean aboveThreshold, String reason) {
	}

	record BaseYearExpected(List<ExpectedFlag> flags, boolean hasUnresolvedFlag) {
	}

	record BaseYearVector(String id, String description, String source, BaseYearInputs inputs,
			BaseYearExpected expected) {
		@Override
		public String toString() {
			return id + ": " + description;
		}
	}

	record ShareInputs(String partKg, String baseKg) {
	}

	record ShareVector(String id, String description, String source, ShareInputs inputs, String expected) {
		@Override
		public String toString() {
			return id + ": " + description;
		}
	}

	record RoundingVector(String id, String stage, String description, String source, String input, Long coveredDays,
			Long totalDays, String partKg, String baseKg, String expected) {
		@Override
		public String toString() {
			return id + ": " + description;
		}
	}

	record File(int version, String notes, Map<String, Map<String, String>> gwpReference, Map<String, Factor> factors,
			List<LineVector> lines, List<ProRatingVector> proRating, List<ProRatingSum> proRatingSums,
			List<ConversionVector> conversions, List<BaseYearVector> baseYear, List<ShareVector> baseYearShares,
			List<RoundingVector> rounding) {
	}

	private static File loaded;

	static synchronized File load() {
		if (loaded == null) {
			var mapper = JsonMapper.builder().disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).build();
			try (var in = EngineVectors.class.getResourceAsStream("/ghg/calculation-vectors.json")) {
				if (in == null) {
					throw new IllegalStateException("calculation-vectors.json is not on the test classpath");
				}
				loaded = mapper.readValue(in, File.class);
			}
			catch (IOException ex) {
				throw new UncheckedIOException(ex);
			}
		}
		return loaded;
	}

	static BigDecimal decimal(String value) {
		return value == null ? null : new BigDecimal(value);
	}
}
