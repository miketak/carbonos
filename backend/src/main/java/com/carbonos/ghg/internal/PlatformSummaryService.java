package com.carbonos.ghg.internal;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The platform figures the administration panel opens on (spec 01.5).
 * <p>
 * It carries no tenant inventory data. It may name an organization and count
 * it; it must not carry a facility count, an inventory, a run, a figure in
 * CO2e, or a per-organization breakdown of adoption notices. A platform
 * administrator is an outsider to an organization until they assume logged
 * support access (spec 01.3), and an adoption notice states a movement
 * computed from the organization's own activity data. The per-tenant view of
 * a publication's effect stays in the blast radius of spec 02.5, where an
 * operator decision justifies it.
 */
@Service
@Transactional(readOnly = true)
public class PlatformSummaryService {

	/** How many acts the activity feed shows, and how far back closed grants stay on the register. */
	private static final int RECENT_EVENTS = 10;

	private static final int GRANT_HISTORY_DAYS = 30;

	/** A draft edition waiting for an approver (spec 02.5). */
	public record DraftEdition(String editionId, String packKey, String name, String curatorEmail, long rowCount,
			boolean mayApprove) {
	}

	/** One support grant, live or recently closed: the operator's privileged-access register. */
	public record Grant(UUID organizationId, String organizationName, String adminEmail, String reason,
			Instant grantedAt, Instant expiresAt, Instant endedAt, boolean mine) {
	}

	/** One platform act, newest first. */
	public record Activity(Instant at, String action, String actor, String subject) {
	}

	public record Summary(long organizations, long packFamilies, long publishedEditions, long draftEditionCount,
			long withdrawnEditions, long openNotices, List<DraftEdition> draftEditions, List<Grant> grants,
			List<Activity> recentActivity) {
	}

	private final OrganizationRepository organizations;
	private final SupportAccessRepository grants;
	private final FactorPackFamilyRepository families;
	private final FactorPackEditionRepository editions;
	private final FactorPackRowRepository rows;
	private final FactorPackNoticeRepository notices;
	private final FactorPackEventRepository events;
	private final GhgAccess access;

	PlatformSummaryService(OrganizationRepository organizations, SupportAccessRepository grants,
			FactorPackFamilyRepository families, FactorPackEditionRepository editions, FactorPackRowRepository rows,
			FactorPackNoticeRepository notices, FactorPackEventRepository events, GhgAccess access) {
		this.organizations = organizations;
		this.grants = grants;
		this.families = families;
		this.editions = editions;
		this.rows = rows;
		this.notices = notices;
		this.events = events;
		this.access = access;
	}

	public Summary summary() {
		access.checkAdmin();
		var now = Instant.now();
		var callerId = access.currentUserId();
		var callerEmail = access.currentUserEmail();
		var names = organizationNames();
		return new Summary(organizations.countByDeletedAtIsNull(), families.count(),
				editions.countByStatus(FactorPackStatus.PUBLISHED), editions.countByStatus(FactorPackStatus.DRAFT),
				editions.countByStatus(FactorPackStatus.WITHDRAWN),
				notices.countByStatus(FactorPackNotice.Status.OPEN), drafts(callerId, callerEmail),
				grants(now, callerId, names), activity());
	}

	/**
	 * The drafts in progress, each saying whether this administrator may
	 * approve it. An approver may not be the curator (spec 02.5), so the queue
	 * never offers work that publication would refuse.
	 */
	private List<DraftEdition> drafts(UUID callerId, String callerEmail) {
		return editions.findAllByStatusOrderByEditionIdAsc(FactorPackStatus.DRAFT)
			.stream()
			.map(edition -> new DraftEdition(edition.getEditionId(), edition.getPackKey(), edition.getName(),
					edition.getCuratorEmail(), rows.countByEditionId(edition.getEditionId()),
					!curatedByCaller(edition, callerId, callerEmail)))
			.toList();
	}

	private static boolean curatedByCaller(FactorPackEdition edition, UUID callerId, String callerEmail) {
		var sameId = edition.getCuratorUserId() != null && edition.getCuratorUserId().equals(callerId);
		var sameEmail = edition.getCuratorEmail() != null && callerEmail != null
				&& edition.getCuratorEmail().equalsIgnoreCase(callerEmail);
		return sameId || sameEmail;
	}

	/** Live grants first, then those closed in the last 30 days, so the register is a record. */
	private List<Grant> grants(Instant now, UUID callerId, Map<UUID, String> names) {
		var live = grants.findAllByEndedAtIsNullAndExpiresAtAfterOrderByExpiresAtAsc(now);
		var recent = grants.findAllByGrantedAtAfterOrderByGrantedAtDesc(now.minus(GRANT_HISTORY_DAYS, ChronoUnit.DAYS))
			.stream()
			.filter(grant -> live.stream().noneMatch(open -> open.getId().equals(grant.getId())))
			.toList();
		return java.util.stream.Stream.concat(live.stream(), recent.stream())
			.map(grant -> new Grant(grant.getOrganizationId(),
					names.getOrDefault(grant.getOrganizationId(), "a removed organization"), grant.getAdminEmail(),
					grant.getReason(), grant.getGrantedAt(), grant.getExpiresAt(), grant.getEndedAt(),
					grant.getAdminUserId().equals(callerId)))
			.toList();
	}

	/** The publication trail across every edition, newest first. */
	private List<Activity> activity() {
		return events.findAllByOrderByOccurredAtDesc(PageRequest.of(0, RECENT_EVENTS))
			.stream()
			.map(event -> new Activity(event.getOccurredAt(), event.getAction().name(), event.getActorEmail(),
					event.getEditionId()))
			.toList();
	}

	private Map<UUID, String> organizationNames() {
		return organizations.findAllByDeletedAtIsNullOrderByCreatedAtAsc()
			.stream()
			.collect(Collectors.toMap(Organization::getId, Organization::getName, (a, b) -> a));
	}
}
