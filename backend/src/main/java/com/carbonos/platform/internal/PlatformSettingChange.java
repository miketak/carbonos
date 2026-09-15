package com.carbonos.platform.internal;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One change to one setting, kept forever (spec 01.5). The reason is
 * mandatory: without this record an administrator could widen the
 * support-access window, assume access, and narrow it again, leaving no
 * evidence of a self-serving change to a privileged-access control.
 */
@Entity
@Table(name = "platform_setting_changes")
public class PlatformSettingChange {

	/** The support-access window, in hours. */
	public static final String KEY_SUPPORT_ACCESS_WINDOW_HOURS = "supportAccessWindowHours";

	/** Who may create a reporting organization. */
	public static final String KEY_ORGANIZATION_CREATION = "organizationCreation";

	@Id
	private UUID id;

	@Column(name = "setting_key", nullable = false, length = 60)
	private String settingKey;

	@Column(name = "old_value", nullable = false, length = 60)
	private String oldValue;

	@Column(name = "new_value", nullable = false, length = 60)
	private String newValue;

	@Column(nullable = false, length = 500)
	private String reason;

	@Column(name = "actor_id")
	private UUID actorId;

	@Column(name = "actor_email", nullable = false, length = 320)
	private String actorEmail;

	@Column(name = "changed_at", nullable = false)
	private Instant changedAt;

	protected PlatformSettingChange() {
	}

	PlatformSettingChange(String settingKey, String oldValue, String newValue, String reason, UUID actorId,
			String actorEmail, Instant changedAt) {
		this.id = UUID.randomUUID();
		this.settingKey = settingKey;
		this.oldValue = oldValue;
		this.newValue = newValue;
		this.reason = reason;
		this.actorId = actorId;
		this.actorEmail = actorEmail;
		this.changedAt = changedAt;
	}

	public String getSettingKey() {
		return settingKey;
	}

	public String getOldValue() {
		return oldValue;
	}

	public String getNewValue() {
		return newValue;
	}

	public String getReason() {
		return reason;
	}

	public String getActorEmail() {
		return actorEmail;
	}

	public Instant getChangedAt() {
		return changedAt;
	}
}
