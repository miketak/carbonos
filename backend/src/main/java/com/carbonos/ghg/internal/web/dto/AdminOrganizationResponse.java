package com.carbonos.ghg.internal.web.dto;

import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.internal.SupportAccessService;

/**
 * One organization as the administrators' support list shows it (spec 01.3):
 * its owners, its member count and the caller's grant. No inventory data.
 */
public record AdminOrganizationResponse(UUID id, String name, List<String> ownerEmails, long memberCount,
		SupportAccessResponse supportAccess) {

	public static AdminOrganizationResponse from(SupportAccessService.OrganizationSummary summary) {
		return new AdminOrganizationResponse(summary.organization().getId(), summary.organization().getName(),
				summary.ownerEmails(), summary.memberCount(),
				summary.supportAccess().map(SupportAccessResponse::from).orElse(null));
	}
}
