package com.carbonos.ghg.internal.web.dto;

import com.carbonos.ghg.internal.ConsolidationApproach;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record OrganizationRequest( //
		@NotBlank @Size(max = 120) String name, //
		@NotNull ConsolidationApproach consolidationApproach) {
}
