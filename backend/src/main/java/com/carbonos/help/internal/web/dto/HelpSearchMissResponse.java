package com.carbonos.help.internal.web.dto;

import java.time.Instant;

import com.carbonos.help.internal.HelpSearchMiss;

/** A missed search as the Help metrics page lists it (spec 09). */
public record HelpSearchMissResponse(String query, int count, Instant firstSeen, Instant lastSeen) {

	public static HelpSearchMissResponse from(HelpSearchMiss miss) {
		return new HelpSearchMissResponse(miss.getQueryNormalized(), miss.getCount(), miss.getFirstSeen(),
				miss.getLastSeen());
	}
}
