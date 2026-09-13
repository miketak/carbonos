package com.carbonos.ghg.internal.web.dto;

import java.util.List;

/**
 * One page of the factor library (FU-03): the rows, the page asked for, its
 * size, the total that matches the filters, and how many of those are
 * unapproved, which is what the picker's "Show unapproved" toggle counts.
 */
public record EmissionFactorPageResponse(List<EmissionFactorResponse> items, int page, int size, long total,
		long unapproved) {
}
