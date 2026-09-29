package com.carbonos.help.internal.web.dto;

import java.time.Instant;
import java.util.List;

import com.carbonos.help.internal.HelpFeedbackRepository.PageStats;
import com.carbonos.help.internal.HelpSearchMiss;
import com.carbonos.help.internal.HelpService;

/**
 * The dashboard's two help tiles and what sits behind them (spec 09). Rates
 * are null, not zero, when nothing was counted: an empty help centre is not a
 * help centre nobody found useful.
 */
public record HelpSummaryResponse(FeedbackTotals feedback, SearchTotals search,
		List<PageBelowTarget> pagesBelowTarget, List<TopMiss> topMisses) {

	public record FeedbackTotals(long votes30d, long helpful30d, Double helpfulRate30d) {
	}

	public record SearchTotals(long searches30d, long misses30d, Double missRate30d) {
	}

	public record PageBelowTarget(String pageSlug, long votes, Double helpfulRate) {
	}

	public record TopMiss(String query, int count, Instant lastSeen) {
	}

	public static HelpSummaryResponse from(HelpService.Summary summary) {
		return new HelpSummaryResponse(
				new FeedbackTotals(summary.votes30d(), summary.helpful30d(),
						HelpService.rate(summary.helpful30d(), summary.votes30d())),
				new SearchTotals(summary.searches30d(), summary.misses30d(),
						HelpService.rate(summary.misses30d(), summary.searches30d())),
				summary.pagesBelowTarget().stream().map(HelpSummaryResponse::below).toList(),
				summary.topMisses().stream().map(HelpSummaryResponse::miss).toList());
	}

	private static PageBelowTarget below(PageStats page) {
		return new PageBelowTarget(page.getPageSlug(), page.getVotes(),
				HelpService.rate(page.getHelpful(), page.getVotes()));
	}

	private static TopMiss miss(HelpSearchMiss miss) {
		return new TopMiss(miss.getQueryNormalized(), miss.getCount(), miss.getLastSeen());
	}
}
