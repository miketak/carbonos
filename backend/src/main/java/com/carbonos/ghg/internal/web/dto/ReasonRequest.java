package com.carbonos.ghg.internal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** The reason an act on the record needs (spec 05.2): voiding a run, withdrawing a final designation. */
public record ReasonRequest( //
		@NotBlank @Size(min = 5, max = 500) String reason) {
}
