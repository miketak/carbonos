package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;

import com.carbonos.ghg.internal.RecalculationTrigger;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** A methodology-change or error-correction candidate the accountant raises (spec 06.1). */
public record RaiseRecalculationRequest( //
		@NotNull RecalculationTrigger trigger, //
		@NotBlank @Size(max = 400) String reason, //
		@NotNull @DecimalMin("0") @DecimalMax("1000") @Digits(integer = 5, fraction = 2) BigDecimal affectedPercent) {
}
