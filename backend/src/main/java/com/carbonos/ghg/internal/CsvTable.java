package com.carbonos.ghg.internal;

import java.util.ArrayList;
import java.util.List;

/**
 * A small RFC 4180 reader for the import file (spec 04.5): comma separated,
 * double quotes around fields that contain commas, quotes or line breaks, a
 * doubled quote for a literal one, CRLF or LF line endings, a UTF-8 BOM
 * tolerated. The first row is the header.
 */
public final class CsvTable {

	public record Row(int number, List<String> cells) {
	}

	private final List<String> header;
	private final List<Row> rows;

	private CsvTable(List<String> header, List<Row> rows) {
		this.header = header;
		this.rows = rows;
	}

	public List<String> header() {
		return header;
	}

	public List<Row> rows() {
		return rows;
	}

	public static CsvTable parse(String text) {
		var content = text.startsWith("﻿") ? text.substring(1) : text;
		var records = new ArrayList<List<String>>();
		var cells = new ArrayList<String>();
		var cell = new StringBuilder();
		var quoted = false;
		for (int i = 0; i < content.length(); i++) {
			var c = content.charAt(i);
			if (quoted) {
				if (c == '"') {
					if (i + 1 < content.length() && content.charAt(i + 1) == '"') {
						cell.append('"');
						i++;
					}
					else {
						quoted = false;
					}
				}
				else {
					cell.append(c);
				}
			}
			else if (c == '"') {
				quoted = true;
			}
			else if (c == ',') {
				cells.add(cell.toString());
				cell.setLength(0);
			}
			else if (c == '\r') {
				// swallowed: the line ends at the following \n (or here, for a lone \r)
				if (i + 1 < content.length() && content.charAt(i + 1) == '\n') {
					continue;
				}
				cells.add(cell.toString());
				cell.setLength(0);
				records.add(new ArrayList<>(cells));
				cells.clear();
			}
			else if (c == '\n') {
				cells.add(cell.toString());
				cell.setLength(0);
				records.add(new ArrayList<>(cells));
				cells.clear();
			}
			else {
				cell.append(c);
			}
		}
		if (cell.length() > 0 || !cells.isEmpty()) {
			cells.add(cell.toString());
			records.add(new ArrayList<>(cells));
		}
		// drop blank trailing records
		while (!records.isEmpty() && records.getLast().stream().allMatch(String::isBlank)) {
			records.removeLast();
		}
		if (records.isEmpty()) {
			return new CsvTable(List.of(), List.of());
		}
		var header = records.getFirst().stream().map(h -> h.trim().toLowerCase(java.util.Locale.ROOT)).toList();
		var rows = new ArrayList<Row>();
		for (int i = 1; i < records.size(); i++) {
			var record = records.get(i);
			if (record.stream().allMatch(String::isBlank)) {
				continue;
			}
			rows.add(new Row(i + 1, record));
		}
		return new CsvTable(header, rows);
	}
}
