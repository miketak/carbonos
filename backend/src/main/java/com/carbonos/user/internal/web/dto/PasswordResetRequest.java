package com.carbonos.user.internal.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** "Forgot your password?" (spec 01.9): the address only. */
public record PasswordResetRequest(
		@NotBlank(message = "Enter your email.") @Email(message = "Enter a valid email address.") @Size(
				max = 320) String email) {
}
