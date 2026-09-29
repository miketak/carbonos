package com.carbonos.user;

import java.time.Instant;
import java.util.UUID;

/** Published when an account's password changes (spec 01.9); the account holder is told by email. */
public record PasswordChanged(UUID userId, String email, String displayName, How how, Instant at) {

	/** How the password was changed; the email says which. */
	public enum How {
		/** The signed-in user changed it on the profile page. */
		CHANGED_ON_PROFILE,
		/** Somebody holding a reset link set it. */
		RESET_BY_LINK
	}
}
