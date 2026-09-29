package com.carbonos.help.internal.web.dto;

import java.time.Instant;

import com.carbonos.help.internal.HelpFeedbackRepository.PageStats;
import com.carbonos.help.internal.HelpService;

/** One article's tally on the Help metrics page (spec 09). */
public record HelpPageResponse(String pageSlug, long votes, long helpful, Double helpfulRate, Instant lastVoteAt) {

	public static HelpPageResponse from(PageStats page) {
		return new HelpPageResponse(page.getPageSlug(), page.getVotes(), page.getHelpful(),
				HelpService.rate(page.getHelpful(), page.getVotes()), page.getLastVoteAt());
	}
}
