package com.carbonos.ghg.internal;

/** Documented reasons an inventory excludes an activity record, retained for audit (spec 04.4). */
public enum ExclusionReason {

	OUTSIDE_PERIOD, OUTSIDE_BOUNDARY, NON_GHG, DUPLICATE, NOT_APPLICABLE, METHODOLOGY, OTHER, RECORD_REMOVED,

	/** A gas the Montreal Protocol covers: outside the scopes, its mass reported separately (spec 04.8). */
	OUTSIDE_SCOPES_NON_KYOTO;

	/** Reasons the review computes itself; a manual exclusion needs a justification and a magnitude (spec 04.4). */
	public boolean isAutomatic() {
		return this == OUTSIDE_PERIOD || this == OUTSIDE_BOUNDARY || this == RECORD_REMOVED;
	}

	/** Whether the reason records a gas reported outside the scopes rather than a magnitude (spec 04.8). */
	public boolean isOutsideScopes() {
		return this == OUTSIDE_SCOPES_NON_KYOTO;
	}

}
