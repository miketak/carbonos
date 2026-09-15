package com.carbonos.platform.internal.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carbonos.platform.internal.PlatformSettingsService;
import com.carbonos.platform.internal.web.dto.PublicPlatformSettingsResponse;

/**
 * The part of the deployment's policy every signed-in user may read
 * (spec 01.5): how long support access lasts. The screens that explain
 * support access to an owner print the window in force rather than a
 * number baked into the copy.
 */
@RestController
@RequestMapping("/api/platform/settings")
class PublicPlatformSettingsController {

	private final PlatformSettingsService settings;

	PublicPlatformSettingsController(PlatformSettingsService settings) {
		this.settings = settings;
	}

	@GetMapping
	PublicPlatformSettingsResponse get() {
		return new PublicPlatformSettingsResponse(settings.current().getSupportAccessWindowHours());
	}
}
