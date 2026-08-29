package com.carbonos.user.internal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
		@NotBlank(message = "Display name is required.") @Size(max = 100,
				message = "Display name must be at most 100 characters.") String displayName) {
}
