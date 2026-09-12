package com.carbonos.ghg.internal;

/**
 * The kind of upstream emissions a rule derives for category 3 of the Scope 3
 * Standard (spec 04.7): the fuel supply chain behind a litre burned in scope 1,
 * or the losses on the way to a kilowatt-hour consumed in scope 2.
 */
public enum UpstreamRuleKind {

	/** Extraction, refining and transport of a purchased fuel, before it is burned. */
	WELL_TO_TANK,

	/** Grid losses between generation and the meter, on the kilowatt-hours consumed. */
	TRANSMISSION_AND_DISTRIBUTION;

	/** "well-to-tank" or "transmission and distribution losses", as a derived line's note reads. */
	public String phrase() {
		return this == WELL_TO_TANK ? "well-to-tank" : "transmission and distribution losses";
	}
}
