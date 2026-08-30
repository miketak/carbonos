package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record BoundaryTreatmentRequest( //
		@NotNull @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal ownershipPercent, //
		boolean financialControl, //
		boolean operationalControl) {
}
