package com.carbonos.platform.internal.web.dto;

import java.time.Instant;

import com.carbonos.platform.PlatformSettings.EditionsInPublishedPeriods;
import com.carbonos.platform.PlatformSettings.OrganizationCreation;
import com.carbonos.platform.internal.PlatformSettingsRow;

/** The deployment's policy as the administration panel reads it (specs 01.5 and 02.6). */
public record PlatformSettingsResponse(int supportAccessWindowHours, OrganizationCreation organizationCreation,
		EditionsInPublishedPeriods editionsInPublishedPeriods, Instant updatedAt, String updatedBy) {

	public static PlatformSettingsResponse from(PlatformSettingsRow row) {
		return new PlatformSettingsResponse(row.getSupportAccessWindowHours(), row.getOrganizationCreation(),
				row.getEditionsInPublishedPeriods(), row.getUpdatedAt(), row.getUpdatedBy());
	}
}
