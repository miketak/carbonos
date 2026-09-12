package com.carbonos.ghg.internal;

/** Where a record stands on its way to an accountant's review (spec 04.6). */
public enum ActivityStatus {
	/** A fact with everything a reviewer needs: the figures, a stream, a source and evidence. */
	READY,
	/** A fact that lacks one of those, or a draft. */
	NEEDS_ATTENTION,
	/** A hand-entered stub that may still lack quantity, unit or period. */
	DRAFT
}
