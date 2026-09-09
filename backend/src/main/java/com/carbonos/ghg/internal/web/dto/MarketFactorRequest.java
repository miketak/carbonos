package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.carbonos.ghg.internal.MarketFactor;
import com.carbonos.ghg.internal.MarketInstrument;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * A market-based scope 2 factor for one facility (spec 07.1), with whether the
 * instrument meets the eight Scope 2 Quality Criteria of the Guidance (spec
 * 07.2), and the kWh and period it covers (spec 07.3). What it does not
 * cover takes the residual mix or the grid average.
 */
public record MarketFactorRequest( //
		@NotNull MarketInstrument instrumentType, //
		@NotNull @DecimalMin("0") @Digits(integer = 6, fraction = 6) BigDecimal kgCo2ePerKwh, //
		@NotBlank @Size(max = 120) String source, //
		@NotNull Boolean meetsQualityCriteria, //
		@Size(max = 500) String qualityNotes, //
		// the kWh the instrument covers and its period (spec 07.3); a null bound follows the inventory
		@NotNull @Positive @Digits(integer = 15, fraction = 3) BigDecimal coveredKwh, //
		LocalDate periodStart, //
		LocalDate periodEnd) {

	public MarketFactor.Coverage coverage() {
		return new MarketFactor.Coverage(coveredKwh, periodStart, periodEnd);
	}
}
