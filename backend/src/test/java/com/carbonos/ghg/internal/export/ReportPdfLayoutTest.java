package com.carbonos.ghg.internal.export;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.AssuranceLevel;
import com.carbonos.ghg.internal.ConsolidationApproach;
import com.carbonos.ghg.internal.DataQuality;
import com.carbonos.ghg.internal.ExclusionReason;
import com.carbonos.ghg.internal.GwpSet;
import com.carbonos.ghg.internal.Inventory;
import com.carbonos.ghg.internal.InventoryStatus;
import com.carbonos.ghg.internal.MarketInstrument;
import com.carbonos.ghg.internal.RecalculationStatus;
import com.carbonos.ghg.internal.RecalculationTrigger;
import com.carbonos.ghg.internal.RelationshipType;
import com.carbonos.ghg.internal.ReportingBasis;
import com.carbonos.ghg.internal.Scope;
import com.carbonos.ghg.internal.Scope2Criterion;
import com.carbonos.ghg.internal.Scope2MarketBasis;
import com.carbonos.ghg.internal.StructuralChangeConvention;
import com.carbonos.ghg.internal.web.dto.BaseYearResponse;
import com.carbonos.ghg.internal.web.dto.BoundaryExclusionResponse;
import com.carbonos.ghg.internal.web.dto.BoundaryVersionEntryResponse;
import com.carbonos.ghg.internal.web.dto.BoundaryVersionResponse;
import com.carbonos.ghg.internal.web.dto.BoundaryVersionSummaryResponse;
import com.carbonos.ghg.internal.web.dto.MarketFactorResponse;
import com.carbonos.ghg.internal.web.dto.ReportResponse;
import com.carbonos.ghg.internal.web.dto.RunExclusionResponse;
import com.carbonos.ghg.internal.web.dto.RunLineResponse;
import com.carbonos.ghg.internal.web.dto.RunResponse;
import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.parser.PdfTextExtractor;

/**
 * The PDF's layout (spec 07.8): a heading is never the last thing on a page.
 * Reports of every length from one line to enough for four pages are
 * rendered, so headings land at every position of a page, and for each
 * heading the first row of its table (or the first line of its paragraph)
 * appears on the same page as the heading.
 */
class ReportPdfLayoutTest {

	private static final List<String> TABLE_HEADINGS = List.of("Report", "4. Emissions by scope (tonnes CO2e)",
			"5. Emissions by gas", "9. Exclusions", "10. Snapshot lines (kg CO2e)");
	private static final String ORGANIZATION = "Asante Gold Resources Ltd";
	private static final String FIRST_FACILITY = "Obuom Processing Plant";

	@Test
	void everyHeadingStaysWithTheFirstRowOfItsTableOrItsParagraph() throws Exception {
		var longest = 0;
		for (int lines = 1; lines <= 90; lines += 1) {
			var pages = pages(ReportPdf.render(report(lines)));
			longest = Math.max(longest, pages.size());
			for (var heading : ReportPdf.HEADINGS) {
				// a heading over a table must be followed by its column header and a data row; over a paragraph, by its text
				assertKeptTogether(pages, heading, lines, TABLE_HEADINGS.contains(heading) ? 2 : 1);
			}
			for (var subheading : ReportPdf.TABLE_SUBHEADINGS) {
				assertKeptTogether(pages, subheading, lines, 2);
			}
			// the two the audit named, with the first data row of each
			assertThat(pageOf(pages, "By facility")).as("By facility, %d lines", lines).contains(FIRST_FACILITY);
			assertThat(pageOf(pages, "5. Emissions by gas")).as("5. Emissions by gas, %d lines", lines)
				.containsSubsequence("5. Emissions by gas", "CO2", "CH4");
			assertThat(pageOf(pages, "10. Snapshot lines (kg CO2e)")).as("10. Snapshot lines, %d lines", lines)
				.containsSubsequence("10. Snapshot lines (kg CO2e)", "Facility", "ACT-0001");
		}
		assertThat(longest).as("the longest report spans several pages").isGreaterThanOrEqualTo(3);
	}

	@Test
	void theTextReadsInWordsAndReaderDates() throws Exception {
		// the extractor wraps lines where the page does, so whitespace is normalised before reading
		var text = String.join("\n", pages(ReportPdf.render(report(3)))).replaceAll("\\s+", " ");
		assertThat(text).contains("Asante Gold Resources Ltd, operational control approach (Corporate Standard, chapter 3). Boundary version 3 of 3.")
			.contains("Scopes covered: Scope 1, Scope 2, Scope 3. Scope 3 categories declared: 1. Purchased goods and services, "
					+ "3. Fuel- and energy-related activities, 5. Waste generated in operations, 6. Business travel, "
					+ "7. Employee commuting.")
			.contains("officer@review.test, 12 September 2026, 05:38 UTC")
			.contains("Not verified")
			.contains("Outside reporting period")
			.contains("Methodology exclusion")
			.contains("1 January 2025 to 31 December 2025")
			.contains("energy attribute certificate")
			.contains("Basis: contractual instruments applied to the kWh they cover")
			.contains("Flagged (structural change)")
			.contains("Equity share / IPCC AR5");
		assertThat(text).doesNotContainPattern("\\b[A-Z]+_[A-Z_]+\\b").doesNotContainPattern("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}");
	}

	/** The heading's first page must carry it, followed by at least {@code rowsAfter} lines of its own content. */
	private static void assertKeptTogether(List<String> pages, String heading, int lines, int rowsAfter) {
		var page = pageOf(pages, heading);
		var after = page.substring(page.indexOf(heading) + heading.length());
		var content = Arrays.stream(after.split("\n"))
			.map(String::strip)
			.filter(line -> !line.isEmpty() && !line.startsWith(ORGANIZATION + ", FY2025, run") && !line.matches("Page \\d+"))
			.toList();
		assertThat(content).as("'%s' is the last thing on its page in a report of %d lines", heading, lines)
			.hasSizeGreaterThanOrEqualTo(rowsAfter);
	}

	private static String pageOf(List<String> pages, String heading) {
		return pages.stream().filter(page -> page.contains(heading)).findFirst()
			.orElseThrow(() -> new AssertionError("'" + heading + "' is not in the document"));
	}

	static List<String> pages(byte[] pdf) throws Exception {
		var reader = new PdfReader(pdf);
		var extractor = new PdfTextExtractor(reader);
		var pages = new ArrayList<String>();
		for (int page = 1; page <= reader.getNumberOfPages(); page++) {
			pages.add(extractor.getTextFromPage(page));
		}
		reader.close();
		return pages;
	}

	// --- fixture -----------------------------------------------------------

	private static final UUID RUN_ID = UUID.randomUUID();
	private static final UUID INVENTORY_ID = UUID.randomUUID();
	private static final UUID FACILITY_ID = UUID.randomUUID();
	private static final UUID ENTITY_ID = UUID.randomUUID();
	private static final UUID FACTOR_ID = UUID.randomUUID();
	private static final Instant PREPARED_AT = Instant.parse("2026-09-12T05:38:08.038809Z");
	private static final LocalDate START = LocalDate.of(2025, 1, 1);
	private static final LocalDate END = LocalDate.of(2025, 12, 31);

	/** A full report with {@code lineCount} snapshot lines and a quarter as many excluded records. */
	static ReportResponse report(int lineCount) {
		var lines = new ArrayList<RunLineResponse>();
		var total = BigDecimal.ZERO;
		for (int i = 1; i <= lineCount; i++) {
			var kg = new BigDecimal(1000 + i * 7);
			total = total.add(kg);
			lines.add(line(i, kg));
		}
		var exclusions = new ArrayList<RunExclusionResponse>();
		for (int i = 1; i <= Math.max(1, lineCount / 4); i++) {
			exclusions.add(new RunExclusionResponse(UUID.randomUUID(), UUID.randomUUID(), "ACT-" + String.format("%04d", 500 + i),
					FIRST_FACILITY, "Old diesel delivery " + i, new BigDecimal("500"), "litre", LocalDate.of(2024, 6, 1),
					LocalDate.of(2024, 6, 30), i % 2 == 0 ? ExclusionReason.METHODOLOGY : ExclusionReason.OUTSIDE_PERIOD,
					i % 2 == 0 ? "de minimis" : null, i % 2 == 0 ? "Below the 1% threshold of the methodology." : null,
					i % 2 == 0 ? new BigDecimal("1200") : null,
					i % 2 == 0 ? com.carbonos.ghg.internal.ExclusionEstimateState.ESTIMATED : null, null));
		}
		var byGas = new RunResponse.ByGas(total.multiply(new BigDecimal("0.9")), new BigDecimal("1.5"), new BigDecimal("1.5"),
				new BigDecimal("0.2"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
				BigDecimal.ZERO, total.multiply(new BigDecimal("0.05")));
		var run = new RunResponse(RUN_ID, INVENTORY_ID, 3, "Run 003", START, END, ConsolidationApproach.OPERATIONAL_CONTROL,
				GwpSet.AR5, lineCount, total, total, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
				Scope2MarketBasis.INSTRUMENTS, byGas, new BigDecimal("18000"), false, false, null, null, null,
				UUID.randomUUID(), 3, "officer@review.test", PREPARED_AT);
		var header = new ReportResponse.Header(ORGANIZATION, "Accra, Ghana", "sustainability@asante.test", "FY2025", START,
				END, "officer@review.test", PREPARED_AT, null, null, null, 1, List.of(), null, AssuranceLevel.UNVERIFIED,
				null, null, null, null, null, 3, 3);
		var version = new BoundaryVersionResponse(
				new BoundaryVersionSummaryResponse(UUID.randomUUID(), 3, ConsolidationApproach.OPERATIONAL_CONTROL, 2, 2,
						UUID.randomUUID(), "officer@review.test", PREPARED_AT, null, null, null),
				List.of(new BoundaryVersionEntryResponse(ENTITY_ID, ORGANIZATION, RelationshipType.SUBSIDIARY,
						new BigDecimal("100"), true, true, new BigDecimal("100"), List.of(), BigDecimal.ONE,
						"group company or subsidiary under financial control; operational control: 100% (operator)", null,
						null, null, false, null,
						List.of(new BoundaryVersionEntryResponse.VersionFacility(FACILITY_ID, FIRST_FACILITY, "Obuom"))),
						new BoundaryVersionEntryResponse(UUID.randomUUID(), "Tarkwa Gold JV Ltd", RelationshipType.JOINT_VENTURE,
								new BigDecimal("40"), true, false, new BigDecimal("40"), List.of(), BigDecimal.ONE,
								"joint venture under joint financial control; operational control: 100% (operator)",
								LocalDate.of(2025, 7, 1), null, null, false, null, List.of())),
				List.of(new BoundaryExclusionResponse(UUID.randomUUID(), "Takoradi Port Co", UUID.randomUUID(),
						"Takoradi Port Loadout", ExclusionReason.NOT_APPLICABLE, "Associate: no operational control")));
		var instrument = new MarketFactorResponse(UUID.randomUUID(), FACILITY_ID, FIRST_FACILITY, MarketInstrument.CERTIFICATE,
				new BigDecimal("0"), "Supplier REC 2025", true, null,
				Arrays.stream(Scope2Criterion.values())
					.map(c -> new MarketFactorResponse.Criterion(c.name(), c.title(), Scope2Criterion.Answer.MET))
					.toList(),
				0, 0, "IREC-GH-2025-0417", "I-TRACK", 2025, LocalDate.of(2026, 1, 15), new BigDecimal("20000000"), null, null);
		var emissions = new ReportResponse.Emissions(total, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, total,
				tonnes(total), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, tonnes(total), "LOCATION_BASED",
				Scope2MarketBasis.INSTRUMENTS, "DUAL", false, false, null,
				"An adjusted emission factor (residual mix) is not available or has not been estimated to account for "
						+ "voluntary purchases in the markets the instruments sit in.",
				List.of(instrument));
		var gases = List.of(gas("CO2", byGas.co2Kg(), byGas.co2Kg()), gas("CH4", byGas.ch4Kg(), byGas.ch4Kg().multiply(new BigDecimal("28"))),
				gas("N2O", byGas.n2oKg(), byGas.n2oKg().multiply(new BigDecimal("265"))), gas("HFCs", BigDecimal.ZERO, BigDecimal.ZERO),
				gas("PFCs", BigDecimal.ZERO, BigDecimal.ZERO), gas("SF6", BigDecimal.ZERO, BigDecimal.ZERO),
				gas("NF3", BigDecimal.ZERO, BigDecimal.ZERO),
				new ReportResponse.Gas(ReportResponse.CO2E_UNSPLIT, null, byGas.co2eUnsplitKg(), null, tonnes(byGas.co2eUnsplitKg()),
						List.of("Grid electricity, Ghana (2024)", "Waste to landfill")));
		var recalculation = new BaseYearResponse.RecalculationResponse(UUID.randomUUID(), RecalculationTrigger.STRUCTURAL_CHANGE,
				"Tarkwa Gold JV acquired on 1 July 2025", INVENTORY_ID, UUID.randomUUID(), 3, new BigDecimal("12.5"),
				new BigDecimal("12.5"), true, "officer@review.test", RecalculationStatus.FLAGGED, null, null, null, null,
				PREPARED_AT, null);
		var baseYear = new ReportResponse.BaseYearSection(2024, "FY2024", "FY2024 Corporate", UUID.randomUUID(),
				new BigDecimal("5"), "First full year of operation at Obuom.", StructuralChangeConvention.TRANSACTION_DATE, true,
				new ReportResponse.RunFigure(UUID.randomUUID(), "Run 002", new BigDecimal("70000000"), new BigDecimal("50000000"),
						new BigDecimal("15000000"), new BigDecimal("5000000")),
				List.of(new ReportResponse.Recalculation(recalculation, null)),
				List.of(new ReportResponse.ProfileEntry(UUID.randomUUID(), "FY2024 Corporate", 2024, "FY2024",
						LocalDate.of(2024, 1, 1), LocalDate.of(2024, 12, 31), InventoryStatus.PUBLISHED, UUID.randomUUID(),
						new BigDecimal("70000000"), null, null, ConsolidationApproach.OPERATIONAL_CONTROL, GwpSet.AR5),
						new ReportResponse.ProfileEntry(INVENTORY_ID, "FY2025", 2025, "FY2025", START, END, InventoryStatus.FROZEN,
								null, null, null, null, ConsolidationApproach.OPERATIONAL_CONTROL, GwpSet.AR5)),
				List.of(new ReportResponse.ProfileEntry(UUID.randomUUID(), "FY2024 Equity view", 2024, "FY2024",
						LocalDate.of(2024, 1, 1), LocalDate.of(2024, 12, 31), InventoryStatus.FINAL, UUID.randomUUID(),
						new BigDecimal("41000000"), null, null, ConsolidationApproach.EQUITY_SHARE, GwpSet.AR5)));
		var methodology = new ReportResponse.Methodology(GwpSet.AR5, ConsolidationApproach.OPERATIONAL_CONTROL,
				List.of("Diesel (100% mineral diesel)"), List.of("AR5"), false,
				"Emissions were calculated as activity data multiplied by an emission factor and the accounting share of the "
						+ "facility's legal entity under the operational control approach (GHG Protocol Corporate Standard, "
						+ "Chapter 3, Table 1), applied at every level of the group.",
				List.of(new ReportResponse.UpstreamRuleLine("Diesel (100% mineral diesel)", "Well-to-tank diesel",
						com.carbonos.ghg.internal.UpstreamRuleKind.WELL_TO_TANK, 4)));
		var factors = List.of(new ReportResponse.FactorRow(FACTOR_ID, "Diesel (100% mineral diesel)", "litre", GwpSet.AR5,
				new BigDecimal("2.66"), new BigDecimal("2.6307"), new BigDecimal("0.0001"), true, new BigDecimal("0.0001"),
				BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, null, null,
				"UK Government GHG Conversion Factors for Company Reporting 2025", 2026, 2026, List.of("defra-2026"),
				ReportingBasis.SCOPES),
				new ReportResponse.FactorRow(UUID.randomUUID(), "Grid electricity, Ghana (2024)", "kWh", GwpSet.AR5,
						new BigDecimal("0.469"), BigDecimal.ZERO, BigDecimal.ZERO, true, BigDecimal.ZERO, BigDecimal.ZERO,
						BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, null, null, "Ember 2024", 2025,
						2024, List.of("ghana", "sector-mining"), ReportingBasis.SCOPES));
		var byFacility = List.of(new ReportResponse.Breakdown(FACILITY_ID, FIRST_FACILITY, total, BigDecimal.ZERO, BigDecimal.ZERO,
				BigDecimal.ZERO, total, tonnes(total)),
				new ReportResponse.Breakdown(UUID.randomUUID(), "Nkran Camp", BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
						BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
		var byEntity = List.of(new ReportResponse.Breakdown(ENTITY_ID, ORGANIZATION, total, BigDecimal.ZERO, BigDecimal.ZERO,
				BigDecimal.ZERO, total, tonnes(total)));
		var byCountry = List.of(new ReportResponse.Breakdown(null, "GH", total, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
				total, tonnes(total)));
		var byCategory = List.of(new ReportResponse.CategoryFigure(ActivityCategory.PURCHASED_GOODS_SERVICES, BigDecimal.ZERO,
				BigDecimal.ZERO, 0, true, "No purchased goods quantified this year."),
				new ReportResponse.CategoryFigure(ActivityCategory.BUSINESS_TRAVEL, new BigDecimal("2500"), new BigDecimal("2.5"), 1,
						true, null));
		var exclusionSummary = List.of(
				new ReportResponse.ExclusionSummary(ExclusionReason.OUTSIDE_PERIOD, (exclusions.size() + 1) / 2, BigDecimal.ZERO,
						BigDecimal.ZERO, (exclusions.size() + 1) / 2, 0, 0),
				new ReportResponse.ExclusionSummary(ExclusionReason.METHODOLOGY, exclusions.size() / 2, new BigDecimal("1200"),
						new BigDecimal("1.2"), 0, exclusions.size() / 2, 0));
		var dataQuality = new ReportResponse.DataQualitySection(
				List.of(new ReportResponse.TierRow(1, "Metered or invoiced primary data", lineCount, total, BigDecimal.ZERO,
						BigDecimal.ZERO, total, new BigDecimal("100"))),
				null, 0, lineCount, "Data quality follows the Scope 3 Standard's tiers: 100% of the total rests on tier 1 data.",
				"Uncertainty is judged low: metered fuel and invoiced electricity.");
		return new ReportResponse(
				new ReportResponse.Company(ORGANIZATION, ConsolidationApproach.OPERATIONAL_CONTROL, version),
				new ReportResponse.OperationalBoundary(List.of(Scope.SCOPE_1, Scope.SCOPE_2, Scope.SCOPE_3),
						List.of(ActivityCategory.PURCHASED_GOODS_SERVICES, ActivityCategory.FUEL_ENERGY_RELATED,
								ActivityCategory.WASTE_GENERATED, ActivityCategory.BUSINESS_TRAVEL,
								ActivityCategory.EMPLOYEE_COMMUTING),
						List.of(ActivityCategory.BUSINESS_TRAVEL), "Other scope 3 categories are immaterial for a single-mine group.",
						List.of(new Inventory.NotQuantified(ActivityCategory.PURCHASED_GOODS_SERVICES,
								"No purchased goods quantified this year."))),
				new ReportResponse.Period(START, END, "FY2025", InventoryStatus.FROZEN, null, null), emissions, gases,
				gases.stream().map(ReportResponse.Gas::kgCo2e).reduce(BigDecimal.ZERO, BigDecimal::add),
				tonnes(gases.stream().map(ReportResponse.Gas::kgCo2e).reduce(BigDecimal.ZERO, BigDecimal::add)),
				new BigDecimal("18000"), new BigDecimal("18"), baseYear, methodology, version.exclusions(), exclusions, lines,
				run, header, byCategory, byFacility, byEntity, byCountry, factors,
				List.of(new ReportResponse.Intensity("Gold produced", new BigDecimal("120000"), "oz", new BigDecimal("0.346056"))),
				exclusionSummary, dataQuality,
				List.of(new ReportResponse.OutsideScopesRow("HCFC-22 (R-22)", new BigDecimal("85"),
						ReportResponse.OutsideScopesBasis.FACTOR, new BigDecimal("149600"), "AR5", "HCFC-22 (R-22)",
						List.of("ACT-0001"))),
				null, null);
	}

	private static RunLineResponse line(int i, BigDecimal kg) {
		var quantity = kg.divide(new BigDecimal("2.66"), 3, java.math.RoundingMode.HALF_UP);
		return new RunLineResponse(UUID.randomUUID(), UUID.randomUUID(), "ACT-" + String.format("%04d", i), FACILITY_ID,
				FIRST_FACILITY, ENTITY_ID, ORGANIZATION, "GH", "Genset diesel " + i, "INV-" + (2900 + i), FACTOR_ID,
				"Diesel (100% mineral diesel)", "Diesel", null, false, null, DataQuality.MEASURED, 1, null, null, null, null,
				null, Scope.SCOPE_1, ActivityCategory.STATIONARY_COMBUSTION, null, quantity, "litre", "litre", quantity,
				BigDecimal.ONE, new BigDecimal("2.66"), BigDecimal.ONE, LocalDate.of(2025, 8, 1), LocalDate.of(2025, 8, 31), 31, 31,
				BigDecimal.ONE, null, kg,
				new RunResponse.ByGas(kg.multiply(new BigDecimal("0.9")), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
						BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
						BigDecimal.ZERO),
				BigDecimal.ZERO, null, null, null, null, null, null, null, null, null, ReportingBasis.SCOPES, null, null,
				null);
	}

	private static ReportResponse.Gas gas(String name, BigDecimal kg, BigDecimal kgCo2e) {
		return new ReportResponse.Gas(name, kg, kgCo2e, tonnes(kg), tonnes(kgCo2e), List.of());
	}

	private static BigDecimal tonnes(BigDecimal kg) {
		return kg.movePointLeft(3).setScale(3, java.math.RoundingMode.HALF_UP);
	}
}
