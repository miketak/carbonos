package com.carbonos.platform.internal.web.dto;

import com.carbonos.platform.PlatformSettings.OrganizationCreation;

/**
 * A change to the deployment's policy (spec 01.5). A null setting is left as
 * it is; the reason is always required, because a change without one leaves
 * no evidence worth keeping.
 */
public record PlatformSettingsRequest(Integer supportAccessWindowHours, OrganizationCreation organizationCreation,
		String reason) {
}
