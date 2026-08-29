package com.carbonos.ghg.internal.web.dto;

import java.time.Instant;
import java.util.UUID;

import com.carbonos.ghg.internal.ConsolidationApproach;
import com.carbonos.ghg.internal.Organization;

public record OrganizationResponse(UUID id, String name, ConsolidationApproach consolidationApproach,
		long facilityCount, Instant createdAt) {

	public static OrganizationResponse from(Organization organization, long facilityCount) {
		return new OrganizationResponse(organization.getId(), organization.getName(),
				organization.getConsolidationApproach(), facilityCount, organization.getCreatedAt());
	}
}
