package com.carbonos.ghg.internal.web.dto;

/**
 * What the caller may do at the organization list (spec 01.5). The screen
 * mirrors the server rather than guessing, so a control nobody may use is
 * not offered (spec 01.4).
 */
public record OrganizationCapabilitiesResponse(boolean mayCreateOrganization) {
}
