package com.carbonos.user.internal.web.dto;

import java.time.Instant;
import java.util.UUID;

import com.carbonos.user.internal.User;
import com.carbonos.user.internal.UserRole;
import com.carbonos.user.internal.UserStatus;

public record UserResponse(UUID id, String email, String displayName, UserRole role, UserStatus status,
		Instant createdAt) {

	public static UserResponse from(User user) {
		return new UserResponse(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole(),
				user.getStatus(), user.getCreatedAt());
	}
}
