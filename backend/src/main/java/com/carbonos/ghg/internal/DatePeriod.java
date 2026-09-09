package com.carbonos.ghg.internal;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/** A closed range of days, for cut-off and pro-rating arithmetic (spec 04.2). */
record DatePeriod(LocalDate start, LocalDate end) {

	/** Days in the range, both ends included. */
	long days() {
		return ChronoUnit.DAYS.between(start, end) + 1;
	}

	boolean overlaps(LocalDate otherStart, LocalDate otherEnd) {
		return (otherStart == null || !end.isBefore(otherStart)) && (otherEnd == null || !start.isAfter(otherEnd));
	}

	/** This range clipped to another; null bounds are unbounded. Null when they do not overlap. */
	DatePeriod clip(LocalDate otherStart, LocalDate otherEnd) {
		if (!overlaps(otherStart, otherEnd)) {
			return null;
		}
		var from = otherStart == null || otherStart.isBefore(start) ? start : otherStart;
		var to = otherEnd == null || otherEnd.isAfter(end) ? end : otherEnd;
		return new DatePeriod(from, to);
	}

	/** "2025-01-01 to 2025-12-31", or the single day. */
	String describe() {
		return start.equals(end) ? start.toString() : start + " to " + end;
	}
}
