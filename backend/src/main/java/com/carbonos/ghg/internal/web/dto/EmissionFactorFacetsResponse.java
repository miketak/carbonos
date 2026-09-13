package com.carbonos.ghg.internal.web.dto;

import java.util.List;

/**
 * The values the picker's filters can take over the factors an organization
 * can see (FU-03): the publisher's categories, the activities within the
 * category the caller named (or all of them), and the units the visible
 * factors are published in.
 */
public record EmissionFactorFacetsResponse(List<String> categories, List<String> activities, List<String> units) {
}
