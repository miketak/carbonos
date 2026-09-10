package com.carbonos.user.internal.web.dto;

import com.carbonos.user.internal.PasswordPolicy;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CompleteAccessRequest(
		@NotBlank @Size(max = 64) String token, //
		@NotBlank @Size(min = 12, max = 72, message = PasswordPolicy.RULE) String password) {
}
