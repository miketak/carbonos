package com.carbonos.ghg.internal;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * A workbook built by hand for the tests (spec 04.11): the minimum Office Open
 * XML package a reader accepts, with inline strings, numbers, a cell styled as a
 * date, a formula with its cached value, and an optional second sheet. Nothing
 * here depends on the reader under test.
 */
public final class XlsxFixture {

	/** A cell as the fixture writes it. */
	public sealed interface Cell permits Text, Number, DateCell, Formula, Blank {
	}

	public record Text(String value) implements Cell {
	}

	public record Number(String value) implements Cell {
	}

	public record DateCell(LocalDate value) implements Cell {
	}

	/** A formula with the value the spreadsheet last calculated; {@code string} says the cached value is text. */
	public record Formula(String formula, String cached, boolean string) implements Cell {
	}

	public record Blank() implements Cell {
	}

	public static Cell text(String value) {
		return new Text(value);
	}

	public static Cell number(String value) {
		return new Number(value);
	}

	public static Cell date(LocalDate value) {
		return new DateCell(value);
	}

	public static Cell formula(String formula, String cached) {
		return new Formula(formula, cached, false);
	}

	public static Cell blank() {
		return new Blank();
	}

	/** A row of plain text cells. */
	public static List<Cell> row(String... values) {
		var cells = new ArrayList<Cell>();
		for (var value : values) {
			cells.add(value == null ? blank() : text(value));
		}
		return cells;
	}

	/** The serial Excel stores for a date on the 1900 system. */
	public static long serial(LocalDate date) {
		return ChronoUnit.DAYS.between(LocalDate.of(1899, 12, 30), date);
	}

	/**
	 * A workbook whose first sheet holds {@code rows} (row 1 first; a null row is
	 * left empty), with {@code extraSheets} further sheets each holding one cell.
	 */
	public static byte[] workbook(List<List<Cell>> rows, String... extraSheets) {
		var out = new ByteArrayOutputStream();
		try (var zip = new ZipOutputStream(out)) {
			var sheetCount = 1 + extraSheets.length;
			var types = new StringBuilder("""
					<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
					<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
					<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
					<Default Extension="xml" ContentType="application/xml"/>
					<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
					<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
					""");
			for (int i = 1; i <= sheetCount; i++) {
				types.append("<Override PartName=\"/xl/worksheets/sheet").append(i)
					.append(".xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>\n");
			}
			types.append("</Types>");
			put(zip, "[Content_Types].xml", types.toString());
			put(zip, "_rels/.rels", """
					<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
					<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
					<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
					</Relationships>""");
			var workbook = new StringBuilder("""
					<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
					<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
					<sheets>
					""");
			var rels = new StringBuilder("""
					<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
					<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
					<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
					""");
			for (int i = 1; i <= sheetCount; i++) {
				var name = i == 1 ? "Sheet1" : extraSheets[i - 2];
				workbook.append("<sheet name=\"").append(name).append("\" sheetId=\"").append(i).append("\" r:id=\"rId")
					.append(i).append("\"/>\n");
				rels.append("<Relationship Id=\"rId").append(i)
					.append("\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet")
					.append(i).append(".xml\"/>\n");
			}
			workbook.append("</sheets>\n</workbook>");
			rels.append("</Relationships>");
			put(zip, "xl/workbook.xml", workbook.toString());
			put(zip, "xl/_rels/workbook.xml.rels", rels.toString());
			// style 0 is General; style 1 is the built-in date format 14 (m/d/yyyy)
			put(zip, "xl/styles.xml", """
					<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
					<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
					<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
					<fills count="1"><fill><patternFill patternType="none"/></fill></fills>
					<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
					<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
					<cellXfs count="2">
					<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
					<xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
					</cellXfs>
					<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
					</styleSheet>""");
			put(zip, "xl/worksheets/sheet1.xml", sheet(rows));
			for (int i = 2; i <= sheetCount; i++) {
				put(zip, "xl/worksheets/sheet" + i + ".xml", sheet(List.of(List.of(text(extraSheets[i - 2])))));
			}
		}
		catch (IOException ex) {
			throw new UncheckedIOException(ex);
		}
		return out.toByteArray();
	}

	private static String sheet(List<List<Cell>> rows) {
		var xml = new StringBuilder("""
				<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
				<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
				<sheetData>
				""");
		for (int r = 0; r < rows.size(); r++) {
			var row = rows.get(r);
			if (row == null) {
				continue;
			}
			var rowNo = r + 1;
			xml.append("<row r=\"").append(rowNo).append("\">");
			for (int c = 0; c < row.size(); c++) {
				var ref = column(c) + rowNo;
				switch (row.get(c)) {
					case Text t -> xml.append("<c r=\"").append(ref).append("\" t=\"inlineStr\"><is><t>")
						.append(escape(t.value())).append("</t></is></c>");
					case Number n -> xml.append("<c r=\"").append(ref).append("\"><v>").append(n.value()).append("</v></c>");
					case DateCell d -> xml.append("<c r=\"").append(ref).append("\" s=\"1\"><v>").append(serial(d.value()))
						.append("</v></c>");
					case Formula f -> xml.append("<c r=\"").append(ref).append("\"").append(f.string() ? " t=\"str\"" : "")
						.append("><f>").append(escape(f.formula())).append("</f><v>").append(escape(f.cached()))
						.append("</v></c>");
					case Blank b -> {
					}
				}
			}
			xml.append("</row>\n");
		}
		xml.append("</sheetData>\n</worksheet>");
		return xml.toString();
	}

	private static String column(int index) {
		var name = new StringBuilder();
		var n = index;
		do {
			name.insert(0, (char) ('A' + n % 26));
			n = n / 26 - 1;
		}
		while (n >= 0);
		return name.toString();
	}

	private static String escape(String value) {
		return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
	}

	private static void put(ZipOutputStream zip, String name, String content) throws IOException {
		zip.putNextEntry(new ZipEntry(name));
		zip.write(content.getBytes(StandardCharsets.UTF_8));
		zip.closeEntry();
	}
}
