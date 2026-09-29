package com.carbonos.help.internal.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.carbonos.help.internal.HelpService;
import com.carbonos.help.internal.web.dto.HelpFeedbackPageResponse;
import com.carbonos.help.internal.web.dto.HelpPageResponse;
import com.carbonos.help.internal.web.dto.HelpSearchMissResponse;
import com.carbonos.help.internal.web.dto.HelpSummaryResponse;

/**
 * Whether the help works, for the administration console (spec 09): the
 * dashboard's two tiles and the Help metrics page behind them. Under
 * {@code /api/admin/**}, which the security filter reserves for the ADMIN
 * platform role. Nothing here carries a voter hash.
 */
@RestController
@RequestMapping("/api/admin")
class AdminHelpController {

	private final HelpService help;

	AdminHelpController(HelpService help) {
		this.help = help;
	}

	@GetMapping("/summary/help")
	HelpSummaryResponse summary() {
		return HelpSummaryResponse.from(help.summary30d());
	}

	@GetMapping("/help/pages")
	List<HelpPageResponse> pages() {
		return help.pages().stream().map(HelpPageResponse::from).toList();
	}

	@GetMapping("/help/feedback")
	HelpFeedbackPageResponse feedback(@RequestParam(required = false) String slug,
			@RequestParam(required = false) Boolean helpful, @RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "50") int size) {
		return HelpFeedbackPageResponse.from(help.feedback(slug, helpful, page, size));
	}

	@GetMapping("/help/search-misses")
	List<HelpSearchMissResponse> searchMisses(@RequestParam(defaultValue = "100") int size) {
		return help.misses(size).stream().map(HelpSearchMissResponse::from).toList();
	}
}
