package com.carbonos.help.internal.web;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.carbonos.help.internal.HelpRateLimiter;
import com.carbonos.help.internal.HelpService;
import com.carbonos.help.internal.VoterHash;
import com.carbonos.help.internal.web.dto.RecordHelpSearch;
import com.carbonos.help.internal.web.dto.SubmitHelpFeedback;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * The public side of spec 09: a vote on an article and a search report. Both
 * are open to visitors ({@code permitAll} on {@code POST /api/help/**}) but
 * still need the CSRF token, and both answer 204 because the reader gets
 * nothing back but a thank-you.
 */
@RestController
@RequestMapping("/api/help")
class HelpController {

	private final HelpService help;

	private final VoterHash voterHash;

	private final HelpRateLimiter rateLimiter;

	HelpController(HelpService help, VoterHash voterHash, HelpRateLimiter rateLimiter) {
		this.help = help;
		this.voterHash = voterHash;
		this.rateLimiter = rateLimiter;
	}

	@PostMapping("/feedback")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void feedback(@Valid @RequestBody SubmitHelpFeedback body, HttpServletRequest request) {
		var voter = voterHash.of(request);
		rateLimiter.check("feedback", voter);
		help.recordFeedback(voter, body.pageSlug(), body.helpful(), body.reason(), body.comment());
	}

	@PostMapping("/searches")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void search(@Valid @RequestBody RecordHelpSearch body, HttpServletRequest request) {
		rateLimiter.check("searches", voterHash.of(request));
		help.recordSearch(body.hit(), body.query());
	}
}
