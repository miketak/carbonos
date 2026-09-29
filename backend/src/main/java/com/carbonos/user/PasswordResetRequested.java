package com.carbonos.user;

import java.time.Duration;
import java.util.UUID;

/**
 * Published when a password reset link is issued (spec 01.9), by the account
 * holder from the sign-in page or by a platform administrator from Users. The
 * raw token builds the link; the database keeps only its hash, and the
 * completed publication is swept from the event registry.
 */
public record PasswordResetRequested(UUID userId, String email, String displayName, String token,
		Duration validFor, boolean sentByAdministrator) {
}
