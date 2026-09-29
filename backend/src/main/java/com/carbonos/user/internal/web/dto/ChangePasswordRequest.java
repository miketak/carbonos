package com.carbonos.user.internal.web.dto;

import com.carbonos.user.internal.PasswordPolicy;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** The profile's change (spec 01.9); the confirmation field is the page's, not the server's. */
public record ChangePasswordRequest(
		@NotBlank(message = "Enter your current password.") @Size(max = 72) String currentPassword, //
		@NotBlank(message = PasswordPolicy.RULE) @Size(min = 12, max = 72,
				message = PasswordPolicy.RULE) String newPassword) {
}
