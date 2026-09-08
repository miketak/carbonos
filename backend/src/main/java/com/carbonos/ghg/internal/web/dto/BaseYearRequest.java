package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

/** The base year designation and recalculation policy (spec 06). */
public record BaseYearRequest( //
		@NotNull UUID inventoryId, //
		@NotNull @DecimalMin("0") @DecimalMax("100") @Digits(integer = 3, fraction = 2) BigDecimal thresholdPercent, //
		@NotNull Triggers triggers) {

	public record Triggers(boolean structuralChanges, boolean methodologyChanges, boolean errorCorrections) {
	}
}
