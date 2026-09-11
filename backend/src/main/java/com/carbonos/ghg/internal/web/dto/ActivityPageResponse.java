package com.carbonos.ghg.internal.web.dto;

import java.util.List;

import com.carbonos.ghg.internal.GhgService;

/** One page of the register with the counts by readiness (spec 04.6). */
public record ActivityPageResponse(List<ActivityResponse> items, int page, int size, long total, Counts counts) {

	public record Counts(long total, long ready, long readyWithDocument, long needsAttention, long drafts) {
	}

	public static ActivityPageResponse from(GhgService.ActivityPage page) {
		var counts = page.counts();
		return new ActivityPageResponse(page.items().stream().map(ActivityResponse::from).toList(), page.page(),
				page.size(), page.total(), new Counts(counts.total(), counts.ready(), counts.readyWithDocument(),
						counts.needsAttention(), counts.drafts()));
	}
}
