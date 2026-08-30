package com.carbonos.user.internal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CompleteAccessRequest(
		@NotBlank @Size(max = 64) String token, //
		@NotBlank @Size(min = 8, max = 72) String password) {
}
