package com.carbonos.ghg.internal.web.dto;

import com.carbonos.ghg.internal.ExclusionReason;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * A record exclusion (spec 04.4): the reason, its justification in words and
 * what it says about the emissions it leaves out (spec 04.8). Exactly one of a
 * positive {@code estimatedKgCo2e}, {@code estimatedKgCo2e = 0} with
 * {@code emitsNothing}, or {@code notEstimated}. The Montreal Protocol reason
 * takes a {@code gas} and no magnitude at all.
 */
public record ExcludeRequest( //
		@NotNull ExclusionReason reason, //
		@Size(max = 500) String justification, //
		@DecimalMin("0") @Digits(integer = 15, fraction = 3) BigDecimal estimatedKgCo2e, //
		Boolean notEstimated, //
		Boolean emitsNothing, //
		@Size(min = 1, max = 60) String gas) {
}
