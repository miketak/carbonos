package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.Scope;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** An organization's own emission factor with its provenance (spec 02.1). */
public record EmissionFactorRequest( //
		@NotBlank @Size(max = 120) String name, //
		@NotNull Scope defaultScope, //
		@NotNull ActivityCategory defaultCategory, //
		Boolean scopeAgnostic, //
		@NotBlank @Size(max = 30) String unit, //
		@NotNull @PositiveOrZero @Digits(integer = 6, fraction = 6) BigDecimal kgCo2ePerUnit, //
		@PositiveOrZero @Digits(integer = 6, fraction = 6) BigDecimal co2KgPerUnit, //
		@PositiveOrZero @Digits(integer = 6, fraction = 8) BigDecimal ch4KgPerUnit, //
		Boolean ch4Fossil, //
		@PositiveOrZero @Digits(integer = 6, fraction = 8) BigDecimal n2oKgPerUnit, //
		@PositiveOrZero @Digits(integer = 6, fraction = 6) BigDecimal hfcsKgPerUnit, //
		@PositiveOrZero @Digits(integer = 6, fraction = 6) BigDecimal pfcsKgPerUnit, //
		@PositiveOrZero @Digits(integer = 6, fraction = 6) BigDecimal sf6KgPerUnit, //
		@PositiveOrZero @Digits(integer = 6, fraction = 6) BigDecimal nf3KgPerUnit, //
		@PositiveOrZero @Digits(integer = 6, fraction = 6) BigDecimal biogenicCo2KgPerUnit, //
		@Size(max = 255) String blendComposition, //
		@Size(max = 20) String blendGwpSource, //
		@NotBlank @Size(max = 500) String source, //
		@Size(max = 500) String sourceUrl, //
		@Min(1990) @Max(2100) Integer publicationYear, //
		@Min(1990) @Max(2100) Integer dataYear, //
		LocalDate validFrom, //
		LocalDate validTo, //
		@Size(max = 500) String note, //
		Boolean approved) {
}
