package com.carbonos.help.internal.web.dto;

import java.util.List;

import org.springframework.data.domain.Page;

import com.carbonos.help.internal.HelpFeedback;

/** A page of votes and how many match in all (spec 09). */
public record HelpFeedbackPageResponse(List<HelpFeedbackResponse> items, long total) {

	public static HelpFeedbackPageResponse from(Page<HelpFeedback> page) {
		return new HelpFeedbackPageResponse(page.getContent().stream().map(HelpFeedbackResponse::from).toList(),
				page.getTotalElements());
	}
}
