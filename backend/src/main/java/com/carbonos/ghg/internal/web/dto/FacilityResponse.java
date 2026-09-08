package com.carbonos.ghg.internal.web.dto;

import java.time.Instant;
import java.util.UUID;

import com.carbonos.ghg.internal.Facility;
import com.carbonos.ghg.internal.RelationshipType;

public record FacilityResponse(UUID id, String name, String location, UUID entityId, String entityName,
		RelationshipType relationshipType, Instant createdAt) {

	public static FacilityResponse from(Facility facility) {
		return new FacilityResponse(facility.getId(), facility.getName(), facility.getLocation(),
				facility.getEntity().getId(), facility.getEntity().getName(),
				facility.getEntity().getRelationshipType(), facility.getCreatedAt());
	}
}
