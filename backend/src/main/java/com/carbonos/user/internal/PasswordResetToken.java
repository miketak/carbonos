package com.carbonos.user.internal;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One password reset link (spec 01.9): the hash of its token, when it expires, and when it was used. */
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

	@Id
	private UUID id;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@JdbcTypeCode(SqlTypes.CHAR)
	@Column(name = "token_hash", nullable = false, length = 64)
	private String tokenHash;

	@Column(name = "expires_at", nullable = false)
	private Instant expiresAt;

	@Column(name = "used_at")
	private Instant usedAt;

	@Column(name = "requested_by")
	private UUID requestedBy;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected PasswordResetToken() {
	}

	PasswordResetToken(UUID userId, String tokenHash, Instant expiresAt, UUID requestedBy) {
		this.id = UUID.randomUUID();
		this.userId = userId;
		this.tokenHash = tokenHash;
		this.expiresAt = expiresAt;
		this.requestedBy = requestedBy;
	}

	public UUID getId() {
		return id;
	}

	public UUID getUserId() {
		return userId;
	}

	public Instant getExpiresAt() {
		return expiresAt;
	}

	public Instant getUsedAt() {
		return usedAt;
	}

	public UUID getRequestedBy() {
		return requestedBy;
	}

	boolean isUsed() {
		return usedAt != null;
	}

	boolean isExpired(Instant now) {
		return !expiresAt.isAfter(now);
	}

	void markUsed(Instant now) {
		this.usedAt = now;
	}
}
