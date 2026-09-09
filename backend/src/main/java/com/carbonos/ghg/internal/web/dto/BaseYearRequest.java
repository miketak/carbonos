package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

import com.carbonos.ghg.internal.StructuralChangeConvention;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import jakarta.validation.constraints.Size;

/**
 * The base year designation and recalculation policy (spec 06, 06.1): the
 * inventory, the reason for choosing that year, the significance threshold,
 * and the convention for mid-year structural changes. The three triggers of
 * Chapter 5 are always honored, so the retired {@code triggers} field is
 * refused.
 */
public record BaseYearRequest( //
		@NotNull UUID inventoryId, //
		@NotNull @DecimalMin("0") @DecimalMax("100") @Digits(integer = 3, fraction = 2) BigDecimal thresholdPercent, //
		@NotBlank @Size(max = 500) String reason, //
		StructuralChangeConvention structuralChangeConvention, //
		@Null(message = "The Standard makes all three triggers mandatory; the policy no longer switches them.") Object triggers) {
}
