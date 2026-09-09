package com.carbonos.ghg.internal.web.dto;

import com.carbonos.ghg.internal.ExclusionReason;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Why an entity or facility is left out of the boundary (spec 07.2, Chapter 9). */
public record BoundaryExclusionRequest( //
		@NotNull ExclusionReason reason, //
		@Size(max = 500) String detail) {
}
