package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.carbonos.ghg.internal.DataQuality;
import com.carbonos.ghg.internal.GhgService;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateActivityRequest( //
		@NotNull UUID facilityId, //
		UUID streamId, //
		@NotBlank @Size(max = 120) String activityType, //
		@NotNull @Positive @Digits(integer = 11, fraction = 3) BigDecimal quantity, //
		@NotBlank @Size(max = 30) String unit, //
		// the period the quantity was consumed or emitted over (spec 04.2); a reading is a one-day period
		@NotNull @PastOrPresent(message = "The period start cannot be after today.") LocalDate periodStart, //
		@NotNull @PastOrPresent(message = "The period end cannot be after today.") LocalDate periodEnd, //
		@Size(max = 120) String dataSource, //
		@Size(max = 150) String evidenceRef, //
		@NotNull DataQuality dataQuality, //
		@Size(max = 255) String note, //
		// the data quality tier (1 best to 5 worst) and uncertainty (spec 04.4); the tier defaults from the method
		@Min(1) @Max(5) Integer dataQualityTier, //
		@DecimalMin("0") @DecimalMax("1000") @Digits(integer = 4, fraction = 2) BigDecimal uncertaintyPercent, //
		// why the record is corrected; required on a correction, ignored on creation (spec 04.4)
		@Size(max = 500) String reason) {

	public GhgService.ActivityFacts toFacts() {
		return new GhgService.ActivityFacts(facilityId, streamId, activityType, quantity, unit, periodStart,
				periodEnd, dataSource, evidenceRef, dataQuality, note, dataQualityTier, uncertaintyPercent);
	}
}
