package com.carbonos.ghg.internal;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carbonos.user.UserDirectory;

/**
 * A platform administrator's support access to an organization (spec 01.3):
 * assumed with a reason for 24 hours, ended by hand or expired, every step
 * an audit event the organization's owners read. The administrators' list
 * of organizations carries no inventory data.
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

	SupportAccessService(OrganizationRepository organizations, OrganizationMemberRepository members,
			SupportAccessRepository grants, GhgAuditEventRepository auditEvents, GhgAccess access,
			UserDirectory userDirectory) {
		this.organizations = organizations;
		this.members = members;
		this.grants = grants;
		this.auditEvents = auditEvents;
		this.access = access;
		this.userDirectory = userDirectory;
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
	 * Grants the caller an owner's rights on the organization for 24 hours
	 * (spec 01.3). Administrators only; a member of the organization has no
	 * need of it (409); the reason is at least 10 characters (422).
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
		var grant = grants.save(new SupportAccess(organizationId, adminId, email, trimmed, now));
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
	 * Closes the grants whose 24 hours ran out and records the expiry (spec
	 * 01.3). Reads already ignore an expired grant; the sweep only writes the
	 * history line. Runs every minute.
	 */
	@Scheduled(fixedDelayString = "PT1M", initialDelayString = "PT1M")
	public void expireGrants() {
		var expired = grants.findAllByEndedAtIsNullAndExpiresAtLessThanEqual(Instant.now());
		for (var grant : expired) {
			grant.expire();
			auditEvents.save(new GhgAuditEvent(grant.getOrganizationId(), GhgAuditEvent.Action.ADMIN_ACCESS_EXPIRED,
					grant.getAdminUserId(), grant.getAdminEmail(), "support access expired after 24 hours"));
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
}
