package com.carbonos.ghg.internal.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carbonos.ghg.internal.PlatformSummaryService;
import com.carbonos.ghg.internal.web.dto.PlatformSummaryResponse;

/**
 * The platform figures the administration panel opens on (spec 01.5). Under
 * {@code /api/admin/**}, which the security filter reserves for the ADMIN
 * platform role, and checked again in the service.
 */
@RestController
@RequestMapping("/api/admin/summary/platform")
class AdminPlatformSummaryController {

	private final PlatformSummaryService summary;

	AdminPlatformSummaryController(PlatformSummaryService summary) {
		this.summary = summary;
	}

	@GetMapping
	PlatformSummaryResponse get() {
		return PlatformSummaryResponse.from(summary.summary());
	}
}
