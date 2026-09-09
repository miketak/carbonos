package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;

import com.carbonos.ghg.internal.GhgService;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** A density in kg per litre with its source (spec 02.2). */
public record DensityRequest( //
		@NotBlank @Size(max = 120) String material, //
		@NotNull @Positive @Digits(integer = 5, fraction = 5) BigDecimal kgPerLitre, //
		@NotBlank @Size(max = 500) String source, //
		@Size(max = 500) String note) {

	public GhgService.DensityFacts toFacts() {
		return new GhgService.DensityFacts(material, kgPerLitre, source, note);
	}
}
