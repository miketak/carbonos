package com.carbonos.ghg.internal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** The period and approach come from the inventory; a run only needs a label. */
public record RunRequest( //
		@NotBlank @Size(max = 120) String label) {
}
