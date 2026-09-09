package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.util.List;

import com.carbonos.ghg.internal.AssuranceLevel;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** The report header an accountant types before publication (spec 07.4). */
public record ReportMetadataRequest( //
		@Size(max = 160) String approvedBy, //
		@NotNull AssuranceLevel assuranceLevel, //
		@Size(max = 160) String assuranceProvider, //
		@Size(max = 255) String assuranceStatement, //
		// the qualitative uncertainty statement printed with the data-quality table (spec 04.4)
		@Size(max = 1000) String uncertaintyStatement, //
		@NotNull @Valid List<IntensityMetricInput> intensityMetrics) {

	public record IntensityMetricInput( //
			@NotBlank @Size(max = 120) String name, //
			@NotNull @Positive @Digits(integer = 15, fraction = 3) BigDecimal value, //
			@NotBlank @Size(max = 30) String unit) {
	}
}
