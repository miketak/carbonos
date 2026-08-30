package com.carbonos.user.internal;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A visitor's request for a CarbonOS account. Decided requests are kept as an
 * audit trail; only APPROVED ones carry a live setup token.
 */
@Entity
@Table(name = "access_requests")
public class AccessRequest {

	@Id
	private UUID id;

	@Column(nullable = false, length = 320)
	private String email;

	@Column(name = "display_name", nullable = false, length = 100)
	private String displayName;

	@Column(length = 150)
	private String company;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private AccessRequestStatus status;

	@Column(name = "setup_token", unique = true, length = 64)
	private String setupToken;

	@Column(name = "token_expires_at")
	private Instant tokenExpiresAt;

	@Column(name = "decided_at")
	private Instant decidedAt;

	@Column(name = "decided_by")
	private UUID decidedBy;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected AccessRequest() {
	}

	AccessRequest(String email, String displayName, String company) {
		this.id = UUID.randomUUID();
		this.email = email;
		this.displayName = displayName;
		this.company = company;
		this.status = AccessRequestStatus.PENDING;
	}

	void approve(String setupToken, Instant tokenExpiresAt, UUID actorId) {
		this.status = AccessRequestStatus.APPROVED;
		this.setupToken = setupToken;
		this.tokenExpiresAt = tokenExpiresAt;
		this.decidedAt = Instant.now();
		this.decidedBy = actorId;
	}

	void deny(UUID actorId) {
		this.status = AccessRequestStatus.DENIED;
		this.decidedAt = Instant.now();
		this.decidedBy = actorId;
	}

	void complete() {
		this.status = AccessRequestStatus.COMPLETED;
		this.setupToken = null;
		this.tokenExpiresAt = null;
	}

	public UUID getId() {
		return id;
	}

	public String getEmail() {
		return email;
	}

	public String getDisplayName() {
		return displayName;
	}

	public String getCompany() {
		return company;
	}

	public AccessRequestStatus getStatus() {
		return status;
	}

	public String getSetupToken() {
		return setupToken;
	}

	public Instant getTokenExpiresAt() {
		return tokenExpiresAt;
	}

	public Instant getDecidedAt() {
		return decidedAt;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
