package com.carbonos.user.internal.security;

import java.util.UUID;

import org.springframework.security.core.session.SessionRegistry;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Which sessions belong to which account (spec 01.9), so a new password can
 * end the others. The registry is Spring Security's in-memory one, keyed by
 * the account id; the sessions themselves live in the servlet container's
 * memory too, so a restart forgets both together. An expired session is
 * refused by the {@code ConcurrentSessionFilter} on its next request.
 */
@Component
public class UserSessions {

	private final SessionRegistry registry;

	UserSessions(SessionRegistry registry) {
		this.registry = registry;
	}

	/** Records the request's session as one of the account's; call after the sign-in. */
	public void register(HttpServletRequest request, UUID userId) {
		registry.registerNewSession(request.getSession().getId(), userId);
	}

	/** Ends every session of the account except {@code keepSessionId}, which may be null. */
	public void endSessions(UUID userId, String keepSessionId) {
		for (var session : registry.getAllSessions(userId, false)) {
			if (!session.getSessionId().equals(keepSessionId)) {
				session.expireNow();
			}
		}
	}
}
