package com.carbonos.user.internal.web.dto;

import com.carbonos.user.internal.UserRole;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserRequest( //
		@NotBlank @Email @Size(max = 320) String email, //
		@NotBlank @Size(max = 100) String displayName, //
		@NotNull UserRole role, //
		@NotBlank @Size(min = 8, max = 72) String temporaryPassword) {
}
