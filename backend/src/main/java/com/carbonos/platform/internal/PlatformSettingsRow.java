package com.carbonos.platform.internal;

import java.time.Instant;

import com.carbonos.platform.PlatformSettings.OrganizationCreation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * The one settings row (spec 01.5). The database pins it to {@code id = 1},
 * so the deployment has settings rather than a table of them.
 */
@Entity
@Table(name = "platform_settings")
public class PlatformSettingsRow {

	/** The only id there is; the table's CHECK enforces it. */
	static final int ID = 1;

	@Id
	private Integer id;

	@Column(name = "support_access_window_hours", nullable = false)
	private int supportAccessWindowHours;

	@Enumerated(EnumType.STRING)
	@Column(name = "organization_creation", nullable = false, length = 20)
	private OrganizationCreation organizationCreation;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@Column(name = "updated_by", length = 320)
	private String updatedBy;

	protected PlatformSettingsRow() {
	}

	public int getSupportAccessWindowHours() {
		return supportAccessWindowHours;
	}

	public OrganizationCreation getOrganizationCreation() {
		return organizationCreation;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public String getUpdatedBy() {
		return updatedBy;
	}

	void apply(int windowHours, OrganizationCreation creation, String actorEmail, Instant now) {
		this.supportAccessWindowHours = windowHours;
		this.organizationCreation = creation;
		this.updatedBy = actorEmail;
		this.updatedAt = now;
	}
}
