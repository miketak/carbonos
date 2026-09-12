package com.carbonos.ghg.internal;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A platform administrator's support access to an organization (spec 01.3):
 * the rights of an owner for 24 hours from the grant, or until the
 * administrator ends it, with the reason on the record.
 */
@Entity
@Table(name = "ghg_support_access")
public class SupportAccess {

	public static final Duration WINDOW = Duration.ofHours(24);

	@Id
	private UUID id;

	@Column(name = "organization_id", nullable = false)
	private UUID organizationId;

	@Column(name = "admin_user_id", nullable = false)
	private UUID adminUserId;

	@Column(name = "admin_email", nullable = false, length = 320)
	private String adminEmail;

	@Column(nullable = false, length = 500)
	private String reason;

	@Column(name = "granted_at", nullable = false, updatable = false)
	private Instant grantedAt;

	@Column(name = "expires_at", nullable = false)
	private Instant expiresAt;

	@Column(name = "ended_at")
	private Instant endedAt;

	protected SupportAccess() {
	}

	SupportAccess(UUID organizationId, UUID adminUserId, String adminEmail, String reason, Instant grantedAt) {
		this.id = UUID.randomUUID();
		this.organizationId = organizationId;
		this.adminUserId = adminUserId;
		this.adminEmail = adminEmail;
		this.reason = reason;
		this.grantedAt = grantedAt;
		this.expiresAt = grantedAt.plus(WINDOW);
	}

	public UUID getId() {
		return id;
	}

	public UUID getOrganizationId() {
		return organizationId;
	}

	public UUID getAdminUserId() {
		return adminUserId;
	}

	public String getAdminEmail() {
		return adminEmail;
	}

	public String getReason() {
		return reason;
	}

	public Instant getGrantedAt() {
		return grantedAt;
	}

	public Instant getExpiresAt() {
		return expiresAt;
	}

	public Instant getEndedAt() {
		return endedAt;
	}

	/** Whether the grant still applies at {@code now}: not ended by hand and within the 24 hours. */
	public boolean isActiveAt(Instant now) {
		return endedAt == null && expiresAt.isAfter(now);
	}

	/** The administrator ends the access before it expires. */
	void end(Instant at) {
		this.endedAt = at;
	}

	/** The 24 hours ran out; the grant closes at its expiry, not at the moment the sweep noticed. */
	void expire() {
		this.endedAt = expiresAt;
	}
}
