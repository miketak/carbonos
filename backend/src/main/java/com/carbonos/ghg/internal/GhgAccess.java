package com.carbonos.ghg.internal;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.ErrorResponseException;

import com.carbonos.user.AuthenticatedUser;

/**
 * Tenant isolation and roles (spec 01, 01.2, 01.3): an organization and
 * everything nested under it is visible to its members only, and each
 * member's role decides what they may change. A platform administrator is an
 * outsider until they assume support access, which gives them an owner's
 * rights for 24 hours, minus deletion and membership changes. Outsiders and
 * removed organizations get 404 so nobody can confirm an id exists; a member
 * without the role gets 403 naming it.
 */
@Component
public class GhgAccess {

	/** The marker every act under support access carries in the history (spec 01.3). */
	static final String SUPPORT_ACCESS_MARKER = "under support access";

	/** A member acting outside their role (spec 01.2). */
	public static class RoleRequiredException extends ErrorResponseException {

		RoleRequiredException(String needed) {
			super(HttpStatus.FORBIDDEN);
			setTitle("Access denied");
			setDetail("This action needs the " + needed + " role in the organization.");
		}
	}

	/** A platform-administrator act attempted by someone else (spec 01.3). */
	public static class AdminRequiredException extends ErrorResponseException {

		AdminRequiredException() {
			super(HttpStatus.FORBIDDEN);
			setTitle("Access denied");
			setDetail("This action needs a platform administrator.");
		}
	}

	private final OrganizationMemberRepository members;
	private final SupportAccessRepository supportAccess;

	GhgAccess(OrganizationMemberRepository members, SupportAccessRepository supportAccess) {
		this.members = members;
		this.supportAccess = supportAccess;
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

	/**
	 * The caller's role in the organization: a member's own, OWNER for a platform
	 * administrator holding active support access, or empty for an outsider.
	 * A removed organization has no roles at all.
	 */
	Optional<OrgRole> roleIn(Organization organization) {
		var principal = principal();
		if (principal == null || organization.isDeleted()) {
			return Optional.empty();
		}
		var membership = members.findByOrganizationIdAndUserId(organization.getId(), principal.getId())
			.map(OrganizationMember::getRole);
		if (membership.isPresent()) {
			return membership;
		}
		if (isAdmin(principal) && activeSupportAccess(organization, principal).isPresent()) {
			return Optional.of(OrgRole.OWNER);
		}
		return Optional.empty();
	}

	/** Whether the caller acts under support access rather than membership (spec 01.3). */
	boolean isUnderSupportAccess(Organization organization) {
		var principal = principal();
		if (principal == null || organization.isDeleted() || !isAdmin(principal)) {
			return false;
		}
		return members.findByOrganizationIdAndUserId(organization.getId(), principal.getId()).isEmpty()
				&& activeSupportAccess(organization, principal).isPresent();
	}

	/** The detail of an audit event, with the support-access marker when the caller acts under it. */
	String attributed(Organization organization, String detail) {
		return isUnderSupportAccess(organization) ? detail + " (" + SUPPORT_ACCESS_MARKER + ")" : detail;
	}

	/** Whether the caller is a member at all (or holds support access); 404 otherwise. */
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

	/** A member who manages the organization's facts and header; support access counts (spec 01.3). */
	void checkOwner(Organization organization) {
		if (!role(organization).isOwner()) {
			throw new RoleRequiredException("OWNER");
		}
	}

	/**
	 * An owner by membership: deletion and membership changes are never granted
	 * by support access (spec 01.3), so an administrator under it gets 403 here.
	 */
	void checkMemberOwner(Organization organization) {
		checkOwner(organization);
		if (isUnderSupportAccess(organization)) {
			throw new RoleRequiredException("OWNER");
		}
	}

	/** A platform administrator, whatever their membership; 403 otherwise. */
	void checkAdmin() {
		if (!isCurrentUserAdmin()) {
			throw new AdminRequiredException();
		}
	}

	private OrgRole role(Organization organization) {
		return roleIn(organization).orElseThrow(() -> GhgNotFoundException.organization(organization.getId()));
	}

	boolean isCurrentUserAdmin() {
		var principal = principal();
		return principal != null && isAdmin(principal);
	}

	private Optional<SupportAccess> activeSupportAccess(Organization organization, AuthenticatedUser principal) {
		return supportAccess.findFirstByOrganizationIdAndAdminUserIdAndEndedAtIsNullAndExpiresAtAfter(
				organization.getId(), principal.getId(), Instant.now());
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
