package com.carbonos.ghg.internal;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carbonos.platform.PlatformSettings;
import com.carbonos.user.UserDirectory;

/**
 * A platform administrator's support access to an organization (spec 01.3):
 * assumed with a reason for the window the deployment sets, ended by hand or
 * expired, every step an audit event the organization's owners read. The
 * administrators' list of organizations carries no inventory data.
 */
@Service
@Transactional
public class SupportAccessService {

	private static final Logger log = LoggerFactory.getLogger(SupportAccessService.class);

	/** One row of the administrators' list (spec 01.3): no facility count, no totals. */
	public record OrganizationSummary(Organization organization, List<String> ownerEmails, long memberCount,
			Optional<SupportAccess> supportAccess) {
	}

	private final OrganizationRepository organizations;
	private final OrganizationMemberRepository members;
	private final SupportAccessRepository grants;
	private final GhgAuditEventRepository auditEvents;
	private final GhgAccess access;
	private final UserDirectory userDirectory;
	private final PlatformSettings settings;

	SupportAccessService(OrganizationRepository organizations, OrganizationMemberRepository members,
			SupportAccessRepository grants, GhgAuditEventRepository auditEvents, GhgAccess access,
			UserDirectory userDirectory, PlatformSettings settings) {
		this.organizations = organizations;
		this.members = members;
		this.grants = grants;
		this.auditEvents = auditEvents;
		this.access = access;
		this.userDirectory = userDirectory;
		this.settings = settings;
	}

	/** Every live organization with its owners, member count and the caller's grant; administrators only. */
	@Transactional(readOnly = true)
	public List<OrganizationSummary> listForAdministrator() {
		access.checkAdmin();
		var now = Instant.now();
		var adminId = access.currentUserId();
		return organizations.findAllByDeletedAtIsNullOrderByCreatedAtAsc()
			.stream()
			.map(organization -> new OrganizationSummary(organization, members.findOwnerEmails(organization.getId()),
					members.countByOrganizationId(organization.getId()),
					grants.findFirstByOrganizationIdAndAdminUserIdAndEndedAtIsNullAndExpiresAtAfter(organization.getId(),
							adminId, now)))
			.toList();
	}

	/**
	 * Grants the caller an owner's rights on the organization for the window the
	 * deployment sets (specs 01.3, 01.5). Administrators only; a member of the
	 * organization has no need of it (409); the reason is at least 10 characters
	 * (422).
	 */
	public SupportAccess assume(UUID organizationId, String reason) {
		access.checkAdmin();
		var organization = liveOrganization(organizationId);
		var adminId = access.currentUserId();
		if (members.findByOrganizationIdAndUserId(organizationId, adminId).isPresent()) {
			throw new GhgRuleViolationException("You are a member of '" + organization.getName()
					+ "'; membership already gives you access, so support access does not apply.");
		}
		var trimmed = reason == null ? "" : reason.trim();
		if (trimmed.length() < 10) {
			throw new GhgFieldException("reason", "Give a reason of at least 10 characters.");
		}
		var now = Instant.now();
		var existing = grants.findFirstByOrganizationIdAndAdminUserIdAndEndedAtIsNullAndExpiresAtAfter(
				organizationId, adminId, now);
		if (existing.isPresent()) {
			throw new GhgRuleViolationException("You already hold support access to '" + organization.getName()
					+ "' until " + existing.get().getExpiresAt() + ". End it before assuming it again.");
		}
		var email = userDirectory.findById(adminId).map(UserDirectory.UserSummary::email)
			.orElse(access.currentUserEmail());
		var grant = grants.save(new SupportAccess(organizationId, adminId, email, trimmed, now, window()));
		// The reason stays the reason the administrator typed: owners read it as
		// that. The window that applied is on the grant itself (spec 01.5), which
		// the overview shows with its expiry, and the expiry line states it too.
		auditEvents.save(new GhgAuditEvent(organizationId, GhgAuditEvent.Action.ADMIN_ACCESS_ASSUMED, adminId, email,
				trimmed));
		return grant;
	}

	/** Ends the caller's active grant on the organization; 404 when there is none. */
	public void end(UUID organizationId) {
		access.checkAdmin();
		var organization = liveOrganization(organizationId);
		var adminId = access.currentUserId();
		var grant = grants.findFirstByOrganizationIdAndAdminUserIdAndEndedAtIsNullAndExpiresAtAfter(organizationId,
				adminId, Instant.now())
			.orElseThrow(() -> GhgNotFoundException.supportAccess(organizationId));
		grant.end(Instant.now());
		auditEvents.save(new GhgAuditEvent(organization.getId(), GhgAuditEvent.Action.ADMIN_ACCESS_ENDED, adminId,
				grant.getAdminEmail(), "support access ended by the administrator"));
	}

	/**
	 * Closes the grants whose window ran out and records the expiry (spec
	 * 01.3). Reads already ignore an expired grant; the sweep only writes the
	 * history line. Runs every minute.
	 * <p>
	 * The duration it states comes from the grant itself, never from the
	 * setting in force now: a window changed afterwards must not retroactively
	 * misdescribe an old grant in the record spec 01.3 exists to keep honest.
	 */
	@Scheduled(fixedDelayString = "PT1M", initialDelayString = "PT1M")
	public void expireGrants() {
		var expired = grants.findAllByEndedAtIsNullAndExpiresAtLessThanEqual(Instant.now());
		for (var grant : expired) {
			grant.expire();
			auditEvents.save(new GhgAuditEvent(grant.getOrganizationId(), GhgAuditEvent.Action.ADMIN_ACCESS_EXPIRED,
					grant.getAdminUserId(), grant.getAdminEmail(),
					"support access expired after " + hours(grant.getWindow())));
		}
		if (!expired.isEmpty()) {
			log.info("Expired {} support access grant(s)", expired.size());
		}
	}

	private Organization liveOrganization(UUID organizationId) {
		return organizations.findById(organizationId)
			.filter(organization -> !organization.isDeleted())
			.orElseThrow(() -> GhgNotFoundException.organization(organizationId));
	}
	/**
	 * The window in force. Falling back is not expected: migration V48 seeds
	 * the settings row and nothing deletes it. It is logged loudly so a grant
	 * issued from the fallback is identifiable afterwards.
	 */
	private Duration window() {
		try {
			return settings.supportAccessWindow();
		}
		catch (RuntimeException ex) {
			log.warn("Platform settings unreadable; granting support access for the default {}",
					SupportAccess.DEFAULT_WINDOW, ex);
			return SupportAccess.DEFAULT_WINDOW;
		}
	}

	private static String hours(Duration window) {
		var count = window.toHours();
		return count + (count == 1 ? " hour" : " hours");
	}


}
