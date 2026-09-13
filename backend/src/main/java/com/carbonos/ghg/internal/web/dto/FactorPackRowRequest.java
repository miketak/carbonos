package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.FactorPackRow;
import com.carbonos.ghg.internal.ReportingBasis;
import com.carbonos.ghg.internal.Scope;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * One row of a draft as a curator states it (spec 02.5). The values carry no
 * scale limit: a row states the publisher's figure at the scale the publication
 * used, and the rounding to {@code numeric(12,6)} happens on import. A null gas
 * is one the publication states nothing about.
 */
public record FactorPackRowRequest( //
		@NotBlank @Size(max = 200) String code, //
		@NotBlank @Size(max = 120) String name, //
		@NotNull Scope defaultScope, //
		@NotNull ActivityCategory defaultCategory, //
		Boolean scopeAgnostic, //
		@NotBlank @Size(max = 30) String unit, //
		@NotNull @PositiveOrZero BigDecimal kgCo2ePerUnit, //
		@PositiveOrZero BigDecimal co2KgPerUnit, //
		@PositiveOrZero BigDecimal ch4KgPerUnit, //
		Boolean ch4Fossil, //
		@PositiveOrZero BigDecimal n2oKgPerUnit, //
		@PositiveOrZero BigDecimal hfcsKgPerUnit, //
		@PositiveOrZero BigDecimal pfcsKgPerUnit, //
		@PositiveOrZero BigDecimal sf6KgPerUnit, //
		@PositiveOrZero BigDecimal nf3KgPerUnit, //
		@PositiveOrZero BigDecimal biogenicCo2KgPerUnit, //
		@Size(max = 255) String blendComposition, //
		@Size(max = 20) String blendGwpSource, //
		@Min(1990) @Max(2100) Integer dataYear, //
		@Size(max = 500) String sourcePublication, //
		@Size(max = 500) String sourceUrl, //
		@Min(1900) @Max(2100) Integer publicationYear, //
		@Size(max = 120) String sourceCategory, //
		@Size(max = 200) String sourceActivity, //
		@Size(max = 500) String sourceDetail, //
		Boolean co2eOnly, //
		Boolean approved, //
		@Size(max = 500) String notes, //
		ReportingBasis reportingBasis) {

	public FactorPackRow.Facts facts() {
		return new FactorPackRow.Facts(code, name, defaultScope, defaultCategory, Boolean.TRUE.equals(scopeAgnostic),
				unit, kgCo2ePerUnit, co2KgPerUnit, ch4KgPerUnit, Boolean.TRUE.equals(ch4Fossil), n2oKgPerUnit,
				hfcsKgPerUnit, pfcsKgPerUnit, sf6KgPerUnit, nf3KgPerUnit, biogenicCo2KgPerUnit, blendComposition,
				blendGwpSource, dataYear, sourcePublication, sourceUrl, publicationYear, sourceCategory,
				sourceActivity, sourceDetail, Boolean.TRUE.equals(co2eOnly), Boolean.TRUE.equals(approved), notes,
				reportingBasis == null ? ReportingBasis.SCOPES : reportingBasis);
	}
}
