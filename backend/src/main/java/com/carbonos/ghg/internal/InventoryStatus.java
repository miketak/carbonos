package com.carbonos.ghg.internal;

/**
 * Lifecycle of an inventory (spec 05.1), covering both its boundary and its
 * activity view. DRAFT: everything editable, runs blocked. FROZEN: boundary
 * and view read-only, runs allowed. IN_REVIEW: as frozen, with one run
 * submitted for review and waiting for someone other than its submitter to
 * sign it off (spec 05.8); a new run withdraws the submission. FINAL: the
 * submitted run is signed off and designated final; reopening needs the
 * designation withdrawn first. PUBLISHED: a report was issued; nothing may
 * change, and a correction is a new inventory that supersedes this one.
 */
public enum InventoryStatus {
	DRAFT, FROZEN, IN_REVIEW, FINAL, PUBLISHED;

	public boolean isEditable() {
		return this == DRAFT;
	}

	public boolean allowsRuns() {
		return this == FROZEN || this == IN_REVIEW || this == FINAL;
	}

	/** The status as a sentence says it: "in review", "frozen". */
	public String label() {
		return name().toLowerCase(java.util.Locale.ROOT).replace('_', ' ');
	}
}
