package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;

import com.carbonos.ghg.internal.GhgService;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** A unit defined as a multiple of a registered one: 1 drum = 200 litre (spec 02.2). */
public record CustomUnitRequest( //
		@NotBlank @Size(max = 30) String code, //
		@NotBlank @Size(max = 120) String label, //
		@NotBlank @Size(max = 30) String baseUnit, //
		@NotNull @Positive @Digits(integer = 12, fraction = 6) BigDecimal factor) {

	public GhgService.CustomUnitFacts toFacts() {
		return new GhgService.CustomUnitFacts(code, label, baseUnit, factor);
	}
}
