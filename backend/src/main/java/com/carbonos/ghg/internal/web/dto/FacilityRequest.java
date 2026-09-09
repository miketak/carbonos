package com.carbonos.ghg.internal.web.dto;

import java.time.LocalDate;
import java.util.UUID;

import com.carbonos.ghg.internal.FacilityType;
import com.carbonos.ghg.internal.GhgService;
import com.carbonos.ghg.internal.LeaseType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** A facility: name, location and the legal entity it belongs to; absent, the reporting company (spec 03.1). */
public record FacilityRequest( //
		@NotBlank @Size(max = 120) String name, //
		@NotBlank @Size(max = 120) String location, //
		@Size(min = 2, max = 2) String country, //
		UUID entityId, //
		// spec 03.4: the grid region, the type and the lease the records inherit
		@Size(max = 40) String gridRegion, //
		FacilityType facilityType, //
		LeaseType leaseType, //
		LocalDate leaseFrom, //
		LocalDate leaseTo) {

	public GhgService.FacilityAttributes attributes() {
		return new GhgService.FacilityAttributes(gridRegion, facilityType, leaseType, leaseFrom, leaseTo);
	}
}
