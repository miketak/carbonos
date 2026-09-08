package com.carbonos.ghg.internal.web.dto;

import java.time.Instant;
import java.util.UUID;

import com.carbonos.ghg.internal.BoundaryVersion;
import com.carbonos.ghg.internal.ConsolidationApproach;

/** A frozen boundary version without its entries, for history listings. */
public record BoundaryVersionSummaryResponse(UUID id, int versionNo, ConsolidationApproach consolidationApproach,
		int facilityCount, UUID frozenByUserId, String frozenBy, Instant frozenAt) {

	public static BoundaryVersionSummaryResponse from(BoundaryVersion version) {
		return new BoundaryVersionSummaryResponse(version.getId(), version.getVersionNo(),
				version.getConsolidationApproach(), version.getFacilityCount(), version.getFrozenByUserId(),
				version.getFrozenBy(), version.getFrozenAt());
	}
}
