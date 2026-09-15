package com.carbonos.platform.internal.web;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carbonos.platform.internal.PlatformSettingsService;
import com.carbonos.platform.internal.web.dto.PlatformSettingChangeResponse;
import com.carbonos.platform.internal.web.dto.PlatformSettingsRequest;
import com.carbonos.platform.internal.web.dto.PlatformSettingsResponse;
import com.carbonos.user.AuthenticatedUser;

/**
 * The deployment's policy (spec 01.5). Under {@code /api/admin/**}, which the
 * security filter reserves for the ADMIN platform role.
 */
@RestController
@RequestMapping("/api/admin/settings")
class PlatformSettingsController {

	private final PlatformSettingsService settings;

	PlatformSettingsController(PlatformSettingsService settings) {
		this.settings = settings;
	}

	@GetMapping
	PlatformSettingsResponse get() {
		return PlatformSettingsResponse.from(settings.current());
	}

	@PutMapping
	PlatformSettingsResponse update(@RequestBody PlatformSettingsRequest body,
			@AuthenticationPrincipal AuthenticatedUser actor) {
		var update = new PlatformSettingsService.Update(body.supportAccessWindowHours(), body.organizationCreation(),
				body.reason());
		return PlatformSettingsResponse.from(settings.update(update, actor.getId(), actor.getUsername()));
	}

	/** Every change ever made, newest first: the artifact a verifier asks for by name. */
	@GetMapping("/history")
	List<PlatformSettingChangeResponse> history() {
		return settings.history().stream().map(PlatformSettingChangeResponse::from).toList();
	}
}
