package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

/**
 * Every field is optional (spec 007): when the treatment is being created, an
 * absent field is prefilled from the facility's facts, so {@code {}} adds a
 * facility exactly as its record describes it; when it already exists, an
 * absent field keeps its current value.
 */
public record BoundaryTreatmentRequest( //
		@DecimalMin("0.00") @DecimalMax("100.00") BigDecimal ownershipPercent, //
		Boolean financialControl, //
		Boolean operationalControl) {
}
