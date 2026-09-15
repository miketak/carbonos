package com.carbonos.user.internal.web.dto;

/**
 * The accounts half of the administration panel's landing figures
 * (spec 01.5). The platform half comes from the {@code ghg} module's own
 * endpoint: each module counts what it owns, so neither has to learn about
 * the other.
 */
public record AccountsSummaryResponse(long usersTotal, long usersActive, long usersPending, long administrators,
		long accessRequestsPending) {
}
