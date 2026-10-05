package com.carbonos.ghg.internal;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

import org.dhatim.fastexcel.reader.Cell;
import org.dhatim.fastexcel.reader.CellType;
import org.dhatim.fastexcel.reader.ReadableWorkbook;
import org.dhatim.fastexcel.reader.ReadingOptions;
import org.dhatim.fastexcel.reader.Row;

/**
 * The first sheet of a workbook as the table the CSV import reads (spec 04.11):
 * row 1 is the header, a date-formatted cell reads {@code YYYY-MM-DD}, a number
 * reads as a plain decimal, a formula reads as the value the spreadsheet last
 * calculated. The table as read is rendered back to CSV so a verifier can
 * re-derive the saved figures from the cells without this reader.
 */
public final class XlsxTable {

	/** The reader named on the batch, so the rendering can be reproduced. */
	public static final String PARSER = "fastexcel-reader 0.19.0";

	/** The table, which sheet it came from and how many there were, the formula cells by row, and the rendering. */
	public record Read(CsvTable table, String sheetName, int sheetCount, Map<Integer, Set<String>> formulaCells,
			String rendered) {
	}

	private static final LocalDate EXCEL_EPOCH = LocalDate.of(1899, 12, 30);

	private static final LocalDate EXCEL_EPOCH_1904 = LocalDate.of(1904, 1, 1);

	// Excel's built-in date and time formats (ECMA-376 part 1, 18.8.30)
	private static final Set<Integer> DATE_FORMAT_IDS = Set.of(14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31,
			32, 33, 34, 35, 36, 45, 46, 47, 50, 51, 52, 53, 54, 55, 56, 57, 58);

	private XlsxTable() {
	}

	/** Whether the bytes are an Office Open XML package (a zip), whatever the file is called. */
	public static boolean isWorkbook(byte[] bytes) {
		return ReadableWorkbook.isOOXMLZipHeader(bytes);
	}

	/**
	 * Reads at most {@code maxRows + 1} data rows, so a file over the limit is
	 * rejected on its count without being held whole.
	 */
	public static Read read(byte[] bytes, int maxRows) {
		try (var workbook = new ReadableWorkbook(new ByteArrayInputStream(bytes), new ReadingOptions(true, true))) {
			var sheets = workbook.getSheets().toList();
			if (sheets.isEmpty()) {
				throw new GhgFieldException("file", "The workbook has no sheet. Download the template and fill it in.");
			}
			var sheet = sheets.getFirst();
			var records = new ArrayList<List<String>>();
			var formulaByRow = new HashMap<Integer, Set<Integer>>();
			var date1904 = workbook.isDate1904();
			try (var rows = sheet.openStream()) {
				var it = rows.limit(maxRows + 2L).iterator();
				while (it.hasNext()) {
					var row = it.next();
					if (records.isEmpty() && row.getRowNum() != 1) {
						throw new GhgFieldException("file",
								"Row 1 of the first sheet must be the header. Download the template.");
					}
					while (records.size() < row.getRowNum() - 1) {
						records.add(List.of());
					}
					var cells = new ArrayList<String>();
					for (int i = 0; i < row.getCellCount(); i++) {
						var cell = row.getCell(i);
						cells.add(text(cell, date1904));
						if (cell != null && cell.getType() == CellType.FORMULA) {
							formulaByRow.computeIfAbsent(row.getRowNum(), k -> new TreeSet<>()).add(i);
						}
					}
					records.add(cells);
				}
			}
			var rendered = CsvTable.render(records);
			var table = CsvTable.parse(rendered);
			var formulaCells = new HashMap<Integer, Set<String>>();
			formulaByRow.forEach((rowNo, columns) -> {
				var names = new TreeSet<String>();
				for (var column : columns) {
					if (column < table.header().size()) {
						names.add(table.header().get(column));
					}
				}
				if (!names.isEmpty()) {
					formulaCells.put(rowNo, names);
				}
			});
			return new Read(table, sheet.getName(), sheets.size(), formulaCells, rendered);
		}
		catch (GhgFieldException ex) {
			throw ex;
		}
		catch (IOException | RuntimeException ex) {
			// the bytes are already in memory, so a failure here is a package the reader cannot open
			throw new GhgFieldException("file", "The workbook could not be read. Save it again as .xlsx or .csv.");
		}
	}

	/** A cell as the CSV import would have read it. */
	static String text(Cell cell, boolean date1904) {
		if (cell == null || cell.getType() == CellType.EMPTY) {
			return "";
		}
		return switch (cell.getType()) {
			case STRING -> cell.asString();
			case BOOLEAN -> Boolean.TRUE.equals(cell.asBoolean()) ? "TRUE" : "FALSE";
			case ERROR -> cell.getRawValue() == null ? "" : cell.getRawValue();
			case NUMBER, FORMULA -> value(cell, date1904);
			default -> cell.getText();
		};
	}

	private static String value(Cell cell, boolean date1904) {
		var value = cell.getValue();
		if (value instanceof LocalDateTime dateTime) {
			return dateTime.toLocalDate().toString();
		}
		if (value instanceof BigDecimal number) {
			if (isDateFormat(cell.getDataFormatId(), cell.getDataFormatString())) {
				var epoch = date1904 ? EXCEL_EPOCH_1904 : EXCEL_EPOCH;
				return epoch.plusDays(number.longValue()).toString();
			}
			return plain(number);
		}
		if (value instanceof Boolean flag) {
			return flag ? "TRUE" : "FALSE";
		}
		return value == null ? "" : value.toString();
	}

	/** No exponent and no trailing zeros: 12500, 12.5, 0. */
	static String plain(BigDecimal number) {
		var stripped = number.stripTrailingZeros();
		return stripped.scale() < 0 ? stripped.setScale(0).toPlainString() : stripped.toPlainString();
	}

	/** A built-in date format id, or a custom format made of date and time letters rather than digit placeholders. */
	static boolean isDateFormat(Integer formatId, String format) {
		if (formatId != null && DATE_FORMAT_IDS.contains(formatId)) {
			return true;
		}
		if (format == null || format.isBlank()) {
			return false;
		}
		var bare = format.replaceAll("\"[^\"]*\"", "").replaceAll("\\[[^]]*]", "").replaceAll("\\\\.", "")
			.toLowerCase(Locale.ROOT);
		if (bare.equals("general") || bare.contains("#") || bare.contains("0") || bare.contains("?")) {
			return false;
		}
		return bare.chars().anyMatch(c -> c == 'y' || c == 'd' || c == 'h' || c == 's' || c == 'm');
	}
}
