package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;

import com.carbonos.ghg.internal.MarketInstrument;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** A market-based scope 2 factor for one facility (spec 07.1). */
public record MarketFactorRequest( //
		@NotNull MarketInstrument instrumentType, //
		@NotNull @DecimalMin("0") @Digits(integer = 6, fraction = 6) BigDecimal kgCo2ePerKwh, //
		@NotBlank @Size(max = 120) String source) {
}
