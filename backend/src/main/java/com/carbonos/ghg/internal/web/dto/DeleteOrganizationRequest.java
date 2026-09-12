package com.carbonos.ghg.internal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** The typed name and the reason a deletion is recorded with (spec 01.3). */
public record DeleteOrganizationRequest(
		@NotBlank(message = "Type the organization's name exactly to confirm.") @Size(max = 120) String name,
		@NotBlank(message = "Give a reason of at least 10 characters.") @Size(max = 500) String reason) {
}
