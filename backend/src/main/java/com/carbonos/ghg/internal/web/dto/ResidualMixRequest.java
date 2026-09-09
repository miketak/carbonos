package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

/** Whether an adjusted residual mix is available for the instruments' markets, and its factor (spec 07.2). */
public record ResidualMixRequest( //
		@NotNull Boolean available, //
		@DecimalMin("0") @Digits(integer = 6, fraction = 6) BigDecimal kgCo2ePerKwh) {
}
