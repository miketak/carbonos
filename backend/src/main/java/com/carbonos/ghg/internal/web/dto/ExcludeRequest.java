package com.carbonos.ghg.internal.web.dto;

import com.carbonos.ghg.internal.ExclusionReason;

import jakarta.validation.constraints.NotNull;

public record ExcludeRequest( //
		@NotNull ExclusionReason reason) {
}
