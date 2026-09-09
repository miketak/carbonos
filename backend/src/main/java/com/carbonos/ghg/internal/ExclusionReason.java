package com.carbonos.ghg.internal;

/** Documented reasons an inventory excludes an activity record, retained for audit (spec 04.4). */
public enum ExclusionReason {

	OUTSIDE_PERIOD, OUTSIDE_BOUNDARY, NON_GHG, DUPLICATE, NOT_APPLICABLE, METHODOLOGY, OTHER, RECORD_REMOVED;

	/** Reasons the review computes itself; a manual exclusion needs a justification and a magnitude (spec 04.4). */
	public boolean isAutomatic() {
		return this == OUTSIDE_PERIOD || this == OUTSIDE_BOUNDARY || this == RECORD_REMOVED;
	}

}
