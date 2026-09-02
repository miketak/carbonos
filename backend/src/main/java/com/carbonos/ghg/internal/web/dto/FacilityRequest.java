package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FacilityRequest( //
		@NotBlank @Size(max = 120) String name, //
		@NotBlank @Size(max = 120) String location, //
		@NotNull @DecimalMin("0") @DecimalMax("100") @Digits(integer = 3, fraction = 2) BigDecimal equitySharePercent, //
		@NotNull Boolean financialControl, //
		@NotNull Boolean operationalControl) {
}
