package com.carbonos.ghg.internal.export;

import java.math.BigDecimal;
import java.util.List;
import java.util.function.Function;

import com.carbonos.ghg.internal.GhgRun;
import com.carbonos.ghg.internal.GhgRunExclusion;
import com.carbonos.ghg.internal.GhgRunLine;

/**
 * The calculation file a verifier re-performs a sample from (spec 07.5): one
 * row per snapshot line with every input the arithmetic used, and the
 * exclusions in a second file. Plain decimals, UTF-8, a header row, and
 * nothing that varies between downloads.
 */
public final class RunCsv {

	private RunCsv() {
	}

	public static String lines(GhgRun run) {
		var columns = List.<Column<GhgRunLine>>of(new Column<>("line_id", l -> l.getId()),
				new Column<>("record_id", l -> l.getActivityId()), new Column<>("facility_id", l -> l.getFacilityId()),
				new Column<>("facility", GhgRunLine::getFacilityName), new Column<>("legal_entity", GhgRunLine::getEntityName),
				new Column<>("country", GhgRunLine::getCountry), new Column<>("activity_type", GhgRunLine::getActivityType),
				new Column<>("evidence_ref", GhgRunLine::getEvidenceRef),
				new Column<>("period_start", GhgRunLine::getPeriodStart), new Column<>("period_end", GhgRunLine::getPeriodEnd),
				new Column<>("scope", GhgRunLine::getScope), new Column<>("category", GhgRunLine::getCategory),
				new Column<>("lease_type", GhgRunLine::getLeaseType), new Column<>("quantity", GhgRunLine::getQuantity),
				new Column<>("unit", GhgRunLine::getUnit), new Column<>("factor_id", GhgRunLine::getFactorId),
				new Column<>("factor", GhgRunLine::getFactorName), new Column<>("factor_unit", GhgRunLine::getFactorUnit),
				new Column<>("converted_quantity", GhgRunLine::getConvertedQuantity),
				new Column<>("conversion_factor", GhgRunLine::getConversionFactor),
				new Column<>("kg_co2e_per_unit", GhgRunLine::getKgCo2ePerUnit), new Column<>("gwp_set", l -> run.getGwpSet()),
				new Column<>("accounting_share", GhgRunLine::getWeight), new Column<>("period_days", GhgRunLine::getPeriodDays),
				new Column<>("covered_days", GhgRunLine::getCoveredDays), new Column<>("period_share", GhgRunLine::getPeriodShare),
				new Column<>("kg_co2e", GhgRunLine::getKgCo2e), new Column<>("co2_kg", GhgRunLine::getCo2Kg),
				new Column<>("ch4_kg", GhgRunLine::getCh4Kg), new Column<>("ch4_fossil", GhgRunLine::isCh4Fossil),
				new Column<>("n2o_kg", GhgRunLine::getN2oKg), new Column<>("hfcs_kg", GhgRunLine::getHfcsKg),
				new Column<>("hfcs_kg_co2e", GhgRunLine::getHfcsKgCo2e), new Column<>("pfcs_kg", GhgRunLine::getPfcsKg),
				new Column<>("pfcs_kg_co2e", GhgRunLine::getPfcsKgCo2e), new Column<>("sf6_kg", GhgRunLine::getSf6Kg),
				new Column<>("nf3_kg", GhgRunLine::getNf3Kg), new Column<>("biogenic_co2_kg", GhgRunLine::getBiogenicCo2Kg),
				new Column<>("market_based_kg_co2e", GhgRunLine::getMarketBasedKgCo2e),
				new Column<>("market_instrument", GhgRunLine::getMarketInstrument),
				new Column<>("market_factor_kg_co2e_per_kwh", GhgRunLine::getMarketFactorKgCo2ePerKwh),
				new Column<>("market_covered_kwh", GhgRunLine::getMarketCoveredKwh),
				new Column<>("market_balance_kwh", GhgRunLine::getMarketBalanceKwh),
				new Column<>("market_balance_basis", GhgRunLine::getMarketBalanceBasis),
				new Column<>("market_note", GhgRunLine::getMarketNote), new Column<>("period_note", GhgRunLine::getPeriodNote));
		return render(columns, run.getLines());
	}

	public static String exclusions(GhgRun run) {
		var columns = List.<Column<GhgRunExclusion>>of(new Column<>("record_id", GhgRunExclusion::getActivityId),
				new Column<>("facility", GhgRunExclusion::getFacilityName),
				new Column<>("activity_type", GhgRunExclusion::getActivityType),
				new Column<>("period_start", GhgRunExclusion::getPeriodStart),
				new Column<>("period_end", GhgRunExclusion::getPeriodEnd), new Column<>("quantity", GhgRunExclusion::getQuantity),
				new Column<>("unit", GhgRunExclusion::getUnit), new Column<>("reason", GhgRunExclusion::getExclusionReason),
				new Column<>("detail", GhgRunExclusion::getExclusionDetail));
		return render(columns, run.getExclusions());
	}

	private record Column<T>(String header, Function<T, Object> value) {
	}

	private static <T> String render(List<Column<T>> columns, List<T> rows) {
		var out = new StringBuilder();
		out.append(String.join(",", columns.stream().map(Column::header).toList())).append("\r\n");
		for (var row : rows) {
			var cells = columns.stream().map(column -> cell(column.value().apply(row))).toList();
			out.append(String.join(",", cells)).append("\r\n");
		}
		return out.toString();
	}

	private static String cell(Object value) {
		if (value == null) {
			return "";
		}
		var text = value instanceof BigDecimal decimal ? decimal.stripTrailingZeros().toPlainString() : value.toString();
		if (text.contains(",") || text.contains("\"") || text.contains("\n") || text.contains("\r")) {
			return "\"" + text.replace("\"", "\"\"") + "\"";
		}
		return text;
	}
}
