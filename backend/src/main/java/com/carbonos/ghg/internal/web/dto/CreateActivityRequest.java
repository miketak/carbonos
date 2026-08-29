package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateActivityRequest( //
		@NotNull UUID facilityId, //
		@NotNull UUID emissionFactorId, //
		@NotNull @Positive @Digits(integer = 11, fraction = 3) BigDecimal quantity, //
		@NotNull LocalDate activityDate, //
		@Size(max = 255) String note) {
}
