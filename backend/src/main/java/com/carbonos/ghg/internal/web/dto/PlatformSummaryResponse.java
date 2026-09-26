package com.carbonos.ghg.internal.web.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.internal.PlatformSummaryService;

/**
 * The platform half of the administration panel's landing figures
 * (spec 01.5). No inventory, no facility count, no figure in CO2e, and no
 * per-organization breakdown of adoption notices: an administrator is an
 * outsider to an organization until they assume logged support access.
 */
public record PlatformSummaryResponse(long organizations, long packFamilies, long publishedEditions,
		long draftEditionCount, long withdrawnEditions, long openNotices, List<DraftEdition> draftEditions,
		List<Grant> grants, List<Activity> recentActivity) {

	public record DraftEdition(String editionId, String packKey, String name, String curatorEmail, long rowCount,
			boolean mayApprove) {
	}

	public record Grant(UUID organizationId, String organizationName, Long organizationAccountNo, String adminEmail,
			String reason, Instant grantedAt, Instant expiresAt, Instant endedAt, boolean mine) {
	}

	public record Activity(Instant at, String action, String actor, String subject) {
	}

	public static PlatformSummaryResponse from(PlatformSummaryService.Summary summary) {
		return new PlatformSummaryResponse(summary.organizations(), summary.packFamilies(), summary.publishedEditions(),
				summary.draftEditionCount(), summary.withdrawnEditions(), summary.openNotices(),
				summary.draftEditions()
					.stream()
					.map(draft -> new DraftEdition(draft.editionId(), draft.packKey(), draft.name(),
							draft.curatorEmail(), draft.rowCount(), draft.mayApprove()))
					.toList(),
				summary.grants()
					.stream()
					.map(grant -> new Grant(grant.organizationId(), grant.organizationName(),
							grant.organizationAccountNo(), grant.adminEmail(), grant.reason(), grant.grantedAt(),
							grant.expiresAt(), grant.endedAt(), grant.mine()))
					.toList(),
				summary.recentActivity()
					.stream()
					.map(act -> new Activity(act.at(), act.action(), act.actor(), act.subject()))
					.toList());
	}
}
