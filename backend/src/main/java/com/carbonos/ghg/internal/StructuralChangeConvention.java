package com.carbonos.ghg.internal;

/**
 * How a mid-year structural change is accounted (spec 06.1, Chapter 5). The
 * Standard's guidance recommends recalculating the base year and the current
 * year for the entire year; accounting from the transaction date, which
 * membership windows implement (spec 03.2), is the common alternative. The
 * policy records which one the company follows and the report prints it.
 */
public enum StructuralChangeConvention {
	TRANSACTION_DATE, WHOLE_YEAR
}
