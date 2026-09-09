package com.carbonos.ghg.internal.web.dto;

import java.util.List;

import com.carbonos.ghg.internal.BoundaryVersion;

/** A frozen boundary version in full: the summary, every entity it recorded, and the operations it left out. */
public record BoundaryVersionResponse(BoundaryVersionSummaryResponse version,
		List<BoundaryVersionEntryResponse> entries, List<BoundaryExclusionResponse> exclusions) {

	public static BoundaryVersionResponse from(BoundaryVersion version) {
		return new BoundaryVersionResponse(BoundaryVersionSummaryResponse.from(version), version.getEntries()
			.stream()
			.map(entry -> BoundaryVersionEntryResponse.from(entry, version.getConsolidationApproach()))
			.toList(), version.getExclusions().stream().map(BoundaryExclusionResponse::from).toList());
	}
}
