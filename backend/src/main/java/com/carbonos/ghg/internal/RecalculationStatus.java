package com.carbonos.ghg.internal;

/**
 * A recalculation candidate is flagged, then either recalculated (a run of the
 * base year) or declined; a removal put back as it stood in the base year is
 * superseded, having changed nothing against it (spec 06).
 */
public enum RecalculationStatus {
	FLAGGED, RECALCULATED, DECLINED, SUPERSEDED
}
