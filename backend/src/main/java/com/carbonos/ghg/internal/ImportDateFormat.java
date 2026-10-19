package com.carbonos.ghg.internal;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.util.List;
import java.util.Optional;

/**
 * How the period columns of an import file are written (spec 04.11, ECO-138).
 * Ghana writes 31/03/2025 and the US 03/31/2025; the preparer says which in
 * the preview and the file is read that way. {@code 2025-03-31} is read under
 * every setting, so the template and a date-typed workbook cell always parse.
 * What the register prints and exports stays ISO (ECO-134).
 */
public enum ImportDateFormat {

	/** 31/03/2025, also 31-03-2025 and 31.03.2025. */
	DAY_FIRST("Day / Month / Year", "day", "dd/MM/uuuu", "dd-MM-uuuu", "dd.MM.uuuu", "d/M/uuuu", "d-M-uuuu", "d.M.uuuu"),

	/** 03/31/2025, also 03-31-2025. */
	MONTH_FIRST("Month / Day / Year", "month", "MM/dd/uuuu", "MM-dd-uuuu", "M/d/uuuu", "M-d-uuuu"),

	/** 2025-03-31 only, the template's form. */
	ISO("Year / Month / Day", "year");

	private final String label;

	private final String first;

	private final List<DateTimeFormatter> formatters;

	ImportDateFormat(String label, String first, String... patterns) {
		this.label = label;
		this.first = first;
		this.formatters = java.util.Arrays.stream(patterns)
			.map(p -> DateTimeFormatter.ofPattern(p).withResolverStyle(ResolverStyle.STRICT))
			.toList();
	}

	/** The option as the dropdown names it. */
	public String label() {
		return label;
	}

	/** ISO first, then the chosen order; empty when the value fits neither. */
	public Optional<LocalDate> parse(String value) {
		var text = value.trim();
		try {
			return Optional.of(LocalDate.parse(text));
		}
		catch (DateTimeParseException ignored) {
			// not ISO; try the chosen order
		}
		for (var formatter : formatters) {
			try {
				return Optional.of(LocalDate.parse(text, formatter));
			}
			catch (DateTimeParseException ignored) {
				// try the next separator
			}
		}
		return Optional.empty();
	}

	/** The rejection sentence for a value that does not fit this format. */
	public String rejection(String field, String value) {
		if (this == ISO) {
			return field + " '" + value + "' is not a date (use 2025-03-31)";
		}
		var other = this == DAY_FIRST ? MONTH_FIRST : DAY_FIRST;
		return field + " '" + value + "' is not a " + label + " date. If the file is " + other.first
				+ "-first, change 'Date format' above.";
	}

}
