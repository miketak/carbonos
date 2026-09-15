package com.carbonos.platform.internal.web.dto;

import java.time.Instant;

import com.carbonos.platform.internal.PlatformSettingChange;

/** One line of the settings history (spec 01.5). */
public record PlatformSettingChangeResponse(String setting, String oldValue, String newValue, String reason,
		String actorEmail, Instant changedAt) {

	public static PlatformSettingChangeResponse from(PlatformSettingChange change) {
		return new PlatformSettingChangeResponse(change.getSettingKey(), change.getOldValue(), change.getNewValue(),
				change.getReason(), change.getActorEmail(), change.getChangedAt());
	}
}
