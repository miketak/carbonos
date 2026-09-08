package com.carbonos.ghg.internal.web.dto;

import java.util.UUID;

import com.carbonos.ghg.internal.RecalculationStatus;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** The accountant's decision on a flag: RECALCULATED with the base-year run that now carries it, or DECLINED. */
public record RecalculationDecisionRequest( //
		@NotNull RecalculationStatus decision, //
		UUID runId, //
		@Size(max = 500) String note) {
}
