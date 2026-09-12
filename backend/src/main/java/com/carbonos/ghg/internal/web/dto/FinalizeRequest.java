package com.carbonos.ghg.internal.web.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** The run to designate final, with the reviewer's optional note (spec 05.5). */
public record FinalizeRequest( //
		@NotNull UUID runId, //
		@Size(max = 500) String note) {
}
