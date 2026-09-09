package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.carbonos.ghg.internal.MarketFactor;
import com.carbonos.ghg.internal.MarketInstrument;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * A market-based scope 2 factor for one facility (spec 07.1), the eight Scope
 * 2 Quality Criteria answered one at a time with the certificate behind the
 * instrument (spec 07.6), and the kWh and period it covers (spec 07.3). What
 * it does not cover takes the residual mix or the grid average.
 */
public record MarketFactorRequest( //
		@NotNull MarketInstrument instrumentType, //
		@NotNull @DecimalMin("0") @Digits(integer = 6, fraction = 6) BigDecimal kgCo2ePerKwh, //
		@NotBlank @Size(max = 120) String source, //
		// older clients: true answers every criterion as met, false leaves them unanswered
		Boolean meetsQualityCriteria, //
		// eight answers in the Guidance's order, null for not yet answered (spec 07.6)
		List<Boolean> criteria, //
		@Size(max = 120) String certificateId, //
		@Size(max = 120) String registry, //
		@Min(1990) @Max(2100) Integer vintage, //
		LocalDate retirementDate, //
		@Size(max = 500) String qualityNotes, //
		// the kWh the instrument covers and its period (spec 07.3); a null bound follows the inventory
		@NotNull @Positive @Digits(integer = 15, fraction = 3) BigDecimal coveredKwh, //
		LocalDate periodStart, //
		LocalDate periodEnd) {

	public MarketFactor.Coverage coverage() {
		return new MarketFactor.Coverage(coveredKwh, periodStart, periodEnd);
	}

	public MarketFactor.Quality quality() {
		var answers = criteria != null ? criteria
				: Boolean.TRUE.equals(meetsQualityCriteria) ? MarketFactor.Quality.allMet().criteria()
						: MarketFactor.Quality.unanswered().criteria();
		return new MarketFactor.Quality(answers, certificateId, registry, vintage, retirementDate);
	}
}
