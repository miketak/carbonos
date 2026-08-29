package com.carbonos.user.internal.web.dto;

import com.carbonos.user.internal.UserRole;
import com.carbonos.user.internal.UserStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest( //
		@NotBlank @Size(max = 100) String displayName, //
		@NotNull UserRole role, //
		@NotNull UserStatus status) {
}
