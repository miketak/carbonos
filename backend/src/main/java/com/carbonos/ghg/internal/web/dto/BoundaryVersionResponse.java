package com.carbonos.ghg.internal.web.dto;

import java.util.List;

import com.carbonos.ghg.internal.BoundaryVersion;

/** A frozen boundary version in full: the summary plus every facility it recorded. */
public record BoundaryVersionResponse(BoundaryVersionSummaryResponse version,
		List<BoundaryVersionEntryResponse> entries) {

	public static BoundaryVersionResponse from(BoundaryVersion version) {
		return new BoundaryVersionResponse(BoundaryVersionSummaryResponse.from(version),
				version.getEntries().stream().map(BoundaryVersionEntryResponse::from).toList());
	}
}
