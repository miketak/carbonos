package com.carbonos.ghg.internal;

import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.ErrorResponseException;

import com.carbonos.user.AuthenticatedUser;

/**
 * Tenant isolation and roles (spec 01, 01.2): an organization and everything
 * nested under it is visible to its members and to platform ADMINs, and each
 * member's role decides what they may change. Outsiders get 404 so they
 * cannot confirm an id exists; a member without the role gets 403 naming it.
 */
@Component
public class GhgAccess {

	/** A member acting outside their role (spec 01.2). */
	public static class RoleRequiredException extends ErrorResponseException {

		RoleRequiredException(String needed) {
			super(HttpStatus.FORBIDDEN);
			setTitle("Access denied");
			setDetail("This action needs the " + needed + " role in the organization.");
		}
	}

	private final OrganizationMemberRepository members;

	GhgAccess(OrganizationMemberRepository members) {
		this.members = members;
	}

	/** The current session's user id, for stamping ownership on creation. */
	UUID currentUserId() {
		var principal = principal();
		if (principal == null) {
			throw new IllegalStateException("No authenticated user in context");
		}
		return principal.getId();
	}

	/** The current session's email, snapshotted onto audit records such as boundary versions. */
	String currentUserEmail() {
		var principal = principal();
		if (principal == null) {
			throw new IllegalStateException("No authenticated user in context");
		}
		return principal.getUsername();
	}

	/** The caller's role in the organization: a member's, OWNER for a platform ADMIN, or empty for an outsider. */
	Optional<OrgRole> roleIn(Organization organization) {
		var principal = principal();
		if (principal == null) {
			return Optional.empty();
		}
		if (isAdmin(principal)) {
			return Optional.of(OrgRole.OWNER);
		}
		return members.findByOrganizationIdAndUserId(organization.getId(), principal.getId())
			.map(OrganizationMember::getRole);
	}

	/** Whether the caller is a member at all (or an ADMIN); 404 otherwise. */
	void check(Organization organization) {
		if (roleIn(organization).isEmpty()) {
			throw GhgNotFoundException.organization(organization.getId());
		}
	}

	/** A member who may change data: everyone but a VERIFIER. */
	void checkWrite(Organization organization) {
		if (!role(organization).canWrite()) {
			throw new RoleRequiredException("PREPARER, REVIEWER or OWNER");
		}
	}

	/** A member who may designate a final run, publish, or create a correction. */
	void checkApprove(Organization organization) {
		if (!role(organization).canApprove()) {
			throw new RoleRequiredException("REVIEWER or OWNER");
		}
	}

	/** A member who manages the organization and its members. */
	void checkOwner(Organization organization) {
		if (!role(organization).isOwner()) {
			throw new RoleRequiredException("OWNER");
		}
	}

	private OrgRole role(Organization organization) {
		return roleIn(organization).orElseThrow(() -> GhgNotFoundException.organization(organization.getId()));
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
