package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.carbonos.ghg.internal.DataQuality;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateActivityRequest( //
		@NotNull UUID facilityId, //
		@NotBlank @Size(max = 120) String activityType, //
		@NotNull @Positive @Digits(integer = 11, fraction = 3) BigDecimal quantity, //
		@NotBlank @Size(max = 30) String unit, //
		// the period the quantity was consumed or emitted over (spec 04.2); a reading is a one-day period
		@NotNull @PastOrPresent LocalDate periodStart, //
		@NotNull @PastOrPresent LocalDate periodEnd, //
		@Size(max = 120) String dataSource, //
		@Size(max = 150) String evidenceRef, //
		@NotNull DataQuality dataQuality, //
		@Size(max = 255) String note) {
}
