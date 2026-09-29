package com.carbonos.user.internal.web.dto;

import com.carbonos.user.internal.User;

/** What the reset page shows: whose password the link sets. Only a holder of a live link gets it. */
public record PasswordResetInfoResponse(String email) {

	public static PasswordResetInfoResponse from(User user) {
		return new PasswordResetInfoResponse(user.getEmail());
	}
}
