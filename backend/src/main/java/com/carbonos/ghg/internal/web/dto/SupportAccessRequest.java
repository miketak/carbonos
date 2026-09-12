package com.carbonos.ghg.internal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Why a platform administrator assumes access to an organization (spec 01.3). */
public record SupportAccessRequest(
		@NotBlank(message = "Give a reason of at least 10 characters.") @Size(max = 500) String reason) {
}
