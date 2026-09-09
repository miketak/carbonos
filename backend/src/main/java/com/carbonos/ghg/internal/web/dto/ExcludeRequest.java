package com.carbonos.ghg.internal.web.dto;

import com.carbonos.ghg.internal.ExclusionReason;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** A record exclusion (spec 04.4): the reason, its justification in words and the emissions it leaves out. */
public record ExcludeRequest( //
		@NotNull ExclusionReason reason, //
		@Size(max = 500) String justification, //
		@DecimalMin("0") @Digits(integer = 15, fraction = 3) BigDecimal estimatedKgCo2e) {
}
