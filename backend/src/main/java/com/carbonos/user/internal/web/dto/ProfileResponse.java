package com.carbonos.user.internal.web.dto;

import java.util.UUID;

import com.carbonos.user.internal.User;

public record ProfileResponse(UUID id, String email, String displayName, boolean hasAvatar, boolean hasResume,
		String resumeFilename) {

	public static ProfileResponse from(User user) {
		return new ProfileResponse(user.getId(), user.getEmail(), user.getDisplayName(), user.getAvatarKey() != null,
				user.getResumeKey() != null, user.getResumeFilename());
	}
}
