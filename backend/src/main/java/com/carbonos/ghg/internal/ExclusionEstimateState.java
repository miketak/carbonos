package com.carbonos.ghg.internal;

import java.math.BigDecimal;

/**
 * What a manual exclusion says about the emissions it leaves out (spec 04.8):
 * a size, a statement that the record emits nothing, or a deliberate refusal
 * to size it. Derived from the stored magnitude, never stored: a null on a
 * manual exclusion means the preparer chose not to size it, and a zero means
 * the preparer stated the record emits nothing. A false zero is worse than
 * "not estimated", because it reads as a sized exclusion when nothing was
 * sized.
 */
public enum ExclusionEstimateState {

	/** A positive magnitude in kg CO2e. */
	ESTIMATED,

	/** Zero, with the statement that the record emits nothing. */
	EMITS_NOTHING,

	/** No magnitude: the preparer has no basis to size it and says so. */
	NOT_ESTIMATED;

	/**
	 * The state of one exclusion, or null where the question is not asked: a
	 * reason the review computes itself, and the Montreal Protocol reason,
	 * which records a gas instead of a magnitude.
	 */
	public static ExclusionEstimateState of(ExclusionReason reason, BigDecimal estimatedKgCo2e) {
		if (reason == null || reason.isAutomatic() || reason == ExclusionReason.OUTSIDE_SCOPES_NON_KYOTO) {
			return null;
		}
		if (estimatedKgCo2e == null) {
			return NOT_ESTIMATED;
		}
		return estimatedKgCo2e.signum() == 0 ? EMITS_NOTHING : ESTIMATED;
	}
}
