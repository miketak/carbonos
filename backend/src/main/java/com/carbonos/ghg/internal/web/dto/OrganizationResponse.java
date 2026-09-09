package com.carbonos.ghg.internal.web.dto;

import java.time.Instant;
import java.util.UUID;

import com.carbonos.ghg.internal.Organization;

public record OrganizationResponse(UUID id, String name, String address, String contact, long facilityCount,
		String myRole, Instant createdAt) {

	public static OrganizationResponse from(Organization organization, long facilityCount, String myRole) {
		return new OrganizationResponse(organization.getId(), organization.getName(), organization.getAddress(),
				organization.getContact(), facilityCount, myRole, organization.getCreatedAt());
	}
}
