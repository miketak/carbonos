package com.carbonos.ghg.internal;

/** A recalculation candidate is flagged, then either recalculated (a run of the base year) or declined. */
public enum RecalculationStatus {
	FLAGGED, RECALCULATED, DECLINED
}
