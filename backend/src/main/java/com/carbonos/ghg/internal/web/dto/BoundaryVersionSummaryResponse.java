package com.carbonos.ghg.internal.web.dto;

import java.time.Instant;
import java.util.UUID;

import com.carbonos.ghg.internal.BoundaryVersion;
import com.carbonos.ghg.internal.ConsolidationApproach;

/**
 * A frozen boundary version without its entries, for history listings. When a
 * reopen superseded it, who reopened it, when and why (spec 05.5).
 */
public record BoundaryVersionSummaryResponse(UUID id, int versionNo, ConsolidationApproach consolidationApproach,
		int entityCount, int facilityCount, UUID frozenByUserId, String frozenBy, Instant frozenAt,
		String reopenedBy, Instant reopenedAt, String reopenReason) {

	public static BoundaryVersionSummaryResponse from(BoundaryVersion version) {
		return new BoundaryVersionSummaryResponse(version.getId(), version.getVersionNo(),
				version.getConsolidationApproach(), version.getEntityCount(), version.getFacilityCount(),
				version.getFrozenByUserId(), version.getFrozenBy(), version.getFrozenAt(), version.getReopenedBy(),
				version.getReopenedAt(), version.getReopenReason());
	}
}
