package com.carbonos.ghg.internal;

/**
 * What an inventory does with a record whose period straddles the reporting
 * period or a membership window (spec 04.2): pro-rate it by days, or block
 * the run until the accountant splits or excludes it.
 */
public enum StraddleTreatment {
	PRO_RATE, BLOCK
}
