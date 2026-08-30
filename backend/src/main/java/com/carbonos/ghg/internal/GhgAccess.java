package com.carbonos.ghg.internal;

import java.util.UUID;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.carbonos.user.AuthenticatedUser;

/**
 * Tenant isolation (AUTH-01, spec 004): an organization and everything nested
 * under it is visible only to its owner and platform ADMINs. Denials are 404s
 * so outsiders cannot even confirm an id exists.
 */
@Component
public class GhgAccess {

	/** The current session's user id, for stamping ownership on creation. */
	UUID currentUserId() {
		var principal = principal();
		if (principal == null) {
			throw new IllegalStateException("No authenticated user in context");
		}
		return principal.getId();
	}

	void check(Organization organization) {
		var principal = principal();
		if (principal != null && (isAdmin(principal) || principal.getId().equals(organization.getOwnerUserId()))) {
			return;
		}
		throw GhgNotFoundException.organization(organization.getId());
	}

	boolean isCurrentUserAdmin() {
		var principal = principal();
		return principal != null && isAdmin(principal);
	}

	private static boolean isAdmin(AuthenticatedUser principal) {
		return principal.getAuthorities()
			.stream()
			.anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
	}

	private static AuthenticatedUser principal() {
		var authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) {
			return user;
		}
		return null;
	}
}
