package com.carbonos.ghg.internal;

/**
 * Lifecycle of an inventory (spec 05.1), covering both its boundary and its
 * activity view. DRAFT: everything editable, runs blocked. FROZEN: boundary
 * and view read-only, runs allowed. FINAL: a run is designated final;
 * reopening needs the designation withdrawn first. PUBLISHED: a report was
 * issued; nothing may change, and a correction is a new inventory that
 * supersedes this one.
 */
public enum InventoryStatus {
	DRAFT, FROZEN, FINAL, PUBLISHED;

	public boolean isEditable() {
		return this == DRAFT;
	}

	public boolean allowsRuns() {
		return this == FROZEN || this == FINAL;
	}
}
