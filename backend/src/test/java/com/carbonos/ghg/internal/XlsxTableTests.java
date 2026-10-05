package com.carbonos.ghg.internal;

import static com.carbonos.ghg.internal.XlsxFixture.blank;
import static com.carbonos.ghg.internal.XlsxFixture.date;
import static com.carbonos.ghg.internal.XlsxFixture.formula;
import static com.carbonos.ghg.internal.XlsxFixture.number;
import static com.carbonos.ghg.internal.XlsxFixture.row;
import static com.carbonos.ghg.internal.XlsxFixture.text;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;

/** Spec 04.11: the first sheet of a workbook reads as the CSV import's table. */
class XlsxTableTests {

	@Test
	void theFirstSheetReadsAsTheCsvTableWithDatesNumbersAndFormulasRendered() {
		var workbook = XlsxFixture.workbook(Arrays.asList(
				row(" Facility ", "Emission_Source", "activity_type", "quantity", "unit", "period_start", "period_end"),
				List.of(text("Nkran Mine"), text("Standby gensets"), text("Diesel consumption"), number("12500"),
						text("litre"), date(LocalDate.of(2025, 3, 1)), date(LocalDate.of(2025, 3, 31))),
				null,
				List.of(text("Nkran Mine"), text("Standby genset 3"), text("Diesel consumption"), formula("D2*2", "25000"),
						text("litre"), date(LocalDate.of(2025, 4, 1)), blank()),
				List.of(text("Nkran Mine"), blank(), text("Grid electricity"), number("1200000.0"), text("kWh"),
						date(LocalDate.of(2025, 4, 1))),
				List.of(text("Nkran Mine"), blank(), text("LPG"), number("12.5"), text("kg"), number("1.2E3"))),
				"Notes");

		assertThat(XlsxTable.isWorkbook(workbook)).isTrue();
		assertThat(XlsxTable.isWorkbook("facility,quantity\r\n".getBytes(StandardCharsets.UTF_8))).isFalse();

		var read = XlsxTable.read(workbook, 10_000);
		assertThat(read.sheetName()).isEqualTo("Sheet1");
		assertThat(read.sheetCount()).isEqualTo(2);
		assertThat(read.table().header()).containsExactly("facility", "emission_source", "activity_type", "quantity",
				"unit", "period_start", "period_end");
		// the blank row 3 is skipped but keeps the numbering of the sheet
		assertThat(read.table().rows()).extracting(CsvTable.Row::number).containsExactly(2, 4, 5, 6);
		assertThat(read.table().rows().get(0).cells()).containsExactly("Nkran Mine", "Standby gensets",
				"Diesel consumption", "12500", "litre", "2025-03-01", "2025-03-31");
		assertThat(read.table().rows().get(1).cells()).startsWith("Nkran Mine", "Standby genset 3", "Diesel consumption",
				"25000", "litre", "2025-04-01");
		assertThat(read.table().rows().get(2).cells()).contains("1200000", "2025-04-01");
		assertThat(read.table().rows().get(3).cells()).contains("12.5", "1200");
		assertThat(read.formulaCells()).containsExactly(java.util.Map.entry(4, Set.of("quantity")));
		// the rendering re-parses to the same table
		var again = CsvTable.parse(read.rendered());
		assertThat(again.header()).isEqualTo(read.table().header());
		assertThat(again.rows()).usingRecursiveComparison().isEqualTo(read.table().rows());
	}

	@Test
	void theHeaderMustBeRowOneAndAnEmptyWorkbookIsRefused() {
		var noHeaderOnRowOne = XlsxFixture.workbook(Arrays.asList(null, row("facility", "quantity")));
		assertThatThrownBy(() -> XlsxTable.read(noHeaderOnRowOne, 10_000)).isInstanceOf(GhgFieldException.class)
			.hasMessageContaining("Row 1 of the first sheet must be the header");
		var notAWorkbook = "PK\u0003\u0004 not really".getBytes(StandardCharsets.UTF_8);
		assertThatThrownBy(() -> XlsxTable.read(notAWorkbook, 10_000)).isInstanceOf(GhgFieldException.class)
			.hasMessageContaining("could not be read");
	}

	@Test
	void numbersRenderPlainAndDateFormatsAreRecognised() {
		assertThat(XlsxTable.plain(new BigDecimal("1.2E+6"))).isEqualTo("1200000");
		assertThat(XlsxTable.plain(new BigDecimal("12500.000"))).isEqualTo("12500");
		assertThat(XlsxTable.plain(new BigDecimal("0.0"))).isEqualTo("0");
		assertThat(XlsxTable.plain(new BigDecimal("12.50"))).isEqualTo("12.5");
		assertThat(XlsxTable.isDateFormat(14, null)).isTrue();
		assertThat(XlsxTable.isDateFormat(164, "dd/mm/yyyy")).isTrue();
		assertThat(XlsxTable.isDateFormat(165, "[$-409]d-mmm-yy;@")).isTrue();
		assertThat(XlsxTable.isDateFormat(0, "General")).isFalse();
		assertThat(XlsxTable.isDateFormat(166, "#,##0.00")).isFalse();
		assertThat(XlsxTable.isDateFormat(167, "0.0 \"m\"")).isFalse();
		assertThat(XlsxTable.isDateFormat(null, null)).isFalse();
	}
}
