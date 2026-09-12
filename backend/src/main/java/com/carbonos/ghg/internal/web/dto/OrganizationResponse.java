package com.carbonos.ghg.internal.web.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.internal.Organization;

/**
 * An organization as its members see it: {@code myRole} is the caller's role
 * (spec 01.2), or ADMIN while a platform administrator holds active support
 * access; {@code supportAccess} lists the active grants for the owners (spec
 * 01.3).
 */
public record OrganizationResponse(UUID id, String name, String address, String contact, long facilityCount,
		String myRole, List<SupportAccessResponse> supportAccess, Instant createdAt) {

	public static OrganizationResponse from(Organization organization, long facilityCount, String myRole,
			List<SupportAccessResponse> supportAccess) {
		return new OrganizationResponse(organization.getId(), organization.getName(), organization.getAddress(),
				organization.getContact(), facilityCount, myRole, supportAccess, organization.getCreatedAt());
	}
}
