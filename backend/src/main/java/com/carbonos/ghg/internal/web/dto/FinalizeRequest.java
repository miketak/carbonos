package com.carbonos.ghg.internal.web.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record FinalizeRequest( //
		@NotNull UUID runId) {
}
