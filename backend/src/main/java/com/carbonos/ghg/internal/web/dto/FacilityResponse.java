package com.carbonos.ghg.internal.web.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.carbonos.ghg.internal.Facility;
import com.carbonos.ghg.internal.FacilityType;
import com.carbonos.ghg.internal.LeaseType;
import com.carbonos.ghg.internal.RelationshipType;

public record FacilityResponse(UUID id, String name, String location, String country, String gridRegion,
		String effectiveGridRegion, FacilityType facilityType, LeaseType leaseType, LocalDate leaseFrom,
		LocalDate leaseTo, UUID entityId, String entityName, RelationshipType relationshipType, Instant createdAt) {

	public static FacilityResponse from(Facility facility) {
		return new FacilityResponse(facility.getId(), facility.getName(), facility.getLocation(),
				facility.getCountry(), facility.getGridRegion(), facility.effectiveGridRegion(),
				facility.getFacilityType(), facility.getLeaseType(), facility.getLeaseFrom(), facility.getLeaseTo(),
				facility.getEntity().getId(), facility.getEntity().getName(),
				facility.getEntity().getRelationshipType(), facility.getCreatedAt());
	}
}
