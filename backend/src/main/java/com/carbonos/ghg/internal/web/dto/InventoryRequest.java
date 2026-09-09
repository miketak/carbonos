package com.carbonos.ghg.internal.web.dto;

import java.time.LocalDate;
import java.util.UUID;

import com.carbonos.ghg.internal.ConsolidationApproach;
import com.carbonos.ghg.internal.GwpSet;
import com.carbonos.ghg.internal.StraddleTreatment;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record InventoryRequest( //
		@NotBlank @Size(max = 120) String name, //
		@NotNull LocalDate periodStart, //
		@NotNull LocalDate periodEnd, //
		@Size(max = 255) String purpose, //
		@Min(1990) @Max(2100) Integer baseYear, //
		@NotNull ConsolidationApproach consolidationApproach, //
		GwpSet gwpSet, //
		StraddleTreatment straddleTreatment, //
		// start with every operation the approach includes in the boundary (spec 03.4); create only
		Boolean prefillBoundary, //
		// copy the boundary, instruments, declaration and every assignment from this inventory (spec 05.3)
		UUID copyFromInventoryId) {
}
