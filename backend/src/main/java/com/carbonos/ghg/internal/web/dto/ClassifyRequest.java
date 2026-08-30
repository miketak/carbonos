package com.carbonos.ghg.internal.web.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record ClassifyRequest( //
		@NotNull UUID emissionFactorId) {
}
