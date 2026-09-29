package com.carbonos.help.internal.web.dto;

import java.time.Instant;

import com.carbonos.help.internal.HelpFeedback;
import com.carbonos.help.internal.HelpFeedbackReason;

/** One vote as the Help metrics page lists it (spec 09); the voter hash stays behind. */
public record HelpFeedbackResponse(Long id, String pageSlug, boolean helpful, HelpFeedbackReason reason,
		String comment, Instant createdAt) {

	public static HelpFeedbackResponse from(HelpFeedback vote) {
		return new HelpFeedbackResponse(vote.getId(), vote.getPageSlug(), vote.isHelpful(), vote.getReason(),
				vote.getComment(), vote.getCreatedAt());
	}
}
