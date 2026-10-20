package com.carbonos.ghg.internal;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.util.List;
import java.util.Optional;

/**
 * How the period columns of an import file are written (spec 04.11, ECO-138).
 * Ghana writes 31/03/2025 and the US 03/31/2025, and either may come with
 * dashes instead of slashes; the preparer picks the order and the separator in
 * the preview and the file is read that way. {@code 2025-03-31} is read under
 * every setting, so the template and a date-typed workbook cell always parse.
 * What the register prints and exports stays ISO (ECO-134).
 */
public enum ImportDateFormat {

	/** 31/03/2025. */
	DAY_FIRST("Day / Month / Year", "31/03/2025", "dd/MM/uuuu", "d/M/uuuu"),

	/** 31-03-2025. */
	DAY_FIRST_DASH("Day - Month - Year", "31-03-2025", "dd-MM-uuuu", "d-M-uuuu"),

	/** 03/31/2025. */
	MONTH_FIRST("Month / Day / Year", "03/31/2025", "MM/dd/uuuu", "M/d/uuuu"),

	/** 03-31-2025. */
	MONTH_FIRST_DASH("Month - Day - Year", "03-31-2025", "MM-dd-uuuu", "M-d-uuuu"),

	/** 2025-03-31, the template's form and the one read under every setting. */
	ISO("Year - Month - Day", "2025-03-31"),

	/** 2025/03/31. */
	ISO_SLASH("Year / Month / Day", "2025/03/31", "uuuu/MM/dd", "uuuu/M/d");

	private final String label;

	private final String example;

	private final List<DateTimeFormatter> formatters;

	ImportDateFormat(String label, String example, String... patterns) {
		this.label = label;
		this.example = example;
		this.formatters = java.util.Arrays.stream(patterns)
			.map(p -> DateTimeFormatter.ofPattern(p).withResolverStyle(ResolverStyle.STRICT))
			.toList();
	}

	/** The option as the dropdown names it. */
	public String label() {
		return label;
	}

	/** A date written this way, as the dropdown shows it. */
	public String example() {
		return example;
	}

	/** ISO first, then the chosen form; empty when the value fits neither. */
	public Optional<LocalDate> parse(String value) {
		var text = value.trim();
		try {
			return Optional.of(LocalDate.parse(text));
		}
		catch (DateTimeParseException ignored) {
			// not ISO; try the chosen form
		}
		for (var formatter : formatters) {
			try {
				return Optional.of(LocalDate.parse(text, formatter));
			}
			catch (DateTimeParseException ignored) {
				// try the next pattern
			}
		}
		return Optional.empty();
	}

	/** The rejection sentence for a value that does not fit this format. */
	public String rejection(String field, String value) {
		if (this == ISO) {
			return field + " '" + value + "' is not a date (use 2025-03-31)";
		}
		return field + " '" + value + "' is not a " + label + " date (" + example
				+ "). If the file writes its dates another way, change 'Date format' above.";
	}

}
