package com.carbonos.platform.internal;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carbonos.platform.PlatformSettings;

/**
 * Reads and changes the deployment's policy (spec 01.5). Every change is
 * recorded with its reason in the same transaction as the change itself, so
 * the history cannot drift from the setting.
 */
@Service
@Transactional(readOnly = true)
public class PlatformSettingsService implements PlatformSettings {

	/** The shortest window worth granting, and the longest one still defensible as break-glass. */
	static final int MIN_WINDOW_HOURS = 1;

	static final int MAX_WINDOW_HOURS = 72;

	/** Long enough that "tidying up" is not a reason, matching the support-access reason rule of spec 01.3. */
	static final int MIN_REASON_LENGTH = 10;

	/** What an administrator changes in one request. */
	public record Update(Integer supportAccessWindowHours, OrganizationCreation organizationCreation, String reason) {
	}

	private final PlatformSettingsRepository settings;

	private final PlatformSettingChangeRepository changes;

	PlatformSettingsService(PlatformSettingsRepository settings, PlatformSettingChangeRepository changes) {
		this.settings = settings;
		this.changes = changes;
	}

	@Override
	public Duration supportAccessWindow() {
		return Duration.ofHours(row().getSupportAccessWindowHours());
	}

	@Override
	public OrganizationCreation organizationCreation() {
		return row().getOrganizationCreation();
	}

	public PlatformSettingsRow current() {
		return row();
	}

	public List<PlatformSettingChange> history() {
		return changes.findAllByOrderByChangedAtDesc();
	}

	/**
	 * Applies the change and writes one history entry per setting that moved.
	 * A request that changes nothing is refused rather than recorded, so the
	 * history stays a list of changes.
	 */
	@Transactional
	public PlatformSettingsRow update(Update update, UUID actorId, String actorEmail) {
		var row = row();
		var window = update.supportAccessWindowHours() == null ? row.getSupportAccessWindowHours()
				: update.supportAccessWindowHours();
		var creation = update.organizationCreation() == null ? row.getOrganizationCreation()
				: update.organizationCreation();
		if (window < MIN_WINDOW_HOURS || window > MAX_WINDOW_HOURS) {
			throw new PlatformFieldException("supportAccessWindowHours", "Support access lasts between "
					+ MIN_WINDOW_HOURS + " and " + MAX_WINDOW_HOURS + " hours.");
		}
		var windowMoved = window != row.getSupportAccessWindowHours();
		var creationMoved = creation != row.getOrganizationCreation();
		if (!windowMoved && !creationMoved) {
			throw new PlatformFieldException("reason", "Nothing changed, so there is nothing to record.");
		}
		var reason = update.reason() == null ? "" : update.reason().trim();
		if (reason.length() < MIN_REASON_LENGTH) {
			throw new PlatformFieldException("reason",
					"Give a reason of at least " + MIN_REASON_LENGTH + " characters.");
		}
		var now = Instant.now();
		if (windowMoved) {
			changes.save(new PlatformSettingChange(PlatformSettingChange.KEY_SUPPORT_ACCESS_WINDOW_HOURS,
					String.valueOf(row.getSupportAccessWindowHours()), String.valueOf(window), reason, actorId,
					actorEmail, now));
		}
		if (creationMoved) {
			changes.save(new PlatformSettingChange(PlatformSettingChange.KEY_ORGANIZATION_CREATION,
					row.getOrganizationCreation().name(), creation.name(), reason, actorId, actorEmail, now));
		}
		row.apply(window, creation, actorEmail, now);
		return settings.save(row);
	}

	private PlatformSettingsRow row() {
		return settings.findById(PlatformSettingsRow.ID)
			.orElseThrow(() -> new IllegalStateException(
					"platform_settings has no row; migration V48 seeds it and nothing deletes it"));
	}
}
