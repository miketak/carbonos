package com.carbonos.ghg.internal.web.dto;

import java.util.UUID;

import com.carbonos.ghg.internal.BoundaryExclusion;
import com.carbonos.ghg.internal.BoundaryVersionExclusion;
import com.carbonos.ghg.internal.ExclusionReason;

/** An operation left out of the boundary with its reason, live or as a version froze it (spec 07.2). */
public record BoundaryExclusionResponse(UUID entityId, String entityName, UUID facilityId, String facilityName,
		ExclusionReason reason, String detail) {

	public static BoundaryExclusionResponse from(BoundaryExclusion exclusion) {
		return new BoundaryExclusionResponse(exclusion.getEntity().getId(), exclusion.getEntity().getName(),
				exclusion.getFacility() == null ? null : exclusion.getFacility().getId(),
				exclusion.getFacility() == null ? null : exclusion.getFacility().getName(), exclusion.getReason(),
				exclusion.getDetail());
	}

	public static BoundaryExclusionResponse from(BoundaryVersionExclusion exclusion) {
		return new BoundaryExclusionResponse(exclusion.getEntityId(), exclusion.getEntityName(),
				exclusion.getFacilityId(), exclusion.getFacilityName(), exclusion.getReason(), exclusion.getDetail());
	}
}
