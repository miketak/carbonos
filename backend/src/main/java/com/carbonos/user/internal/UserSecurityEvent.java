package com.carbonos.user.internal;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One act on an account's password (spec 01.9): whose account, what happened,
 * who did it, and when. Append-only; the row outlives the account.
 */
@Entity
@Table(name = "user_security_events")
public class UserSecurityEvent {

	public enum Action {
		PASSWORD_CHANGED, PASSWORD_RESET_REQUESTED, PASSWORD_RESET_SENT_BY_ADMIN, PASSWORD_RESET_COMPLETED
	}

	@Id
	private UUID id;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Column(name = "user_email", nullable = false, length = 320)
	private String userEmail;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 40)
	private Action action;

	@Column(name = "actor_user_id")
	private UUID actorUserId;

	@Column(name = "actor", nullable = false, length = 320)
	private String actor;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected UserSecurityEvent() {
	}

	UserSecurityEvent(User user, Action action, UUID actorUserId, String actor) {
		this.id = UUID.randomUUID();
		this.userId = user.getId();
		this.userEmail = user.getEmail();
		this.action = action;
		this.actorUserId = actorUserId;
		this.actor = actor;
	}

	public UUID getUserId() {
		return userId;
	}

	public String getUserEmail() {
		return userEmail;
	}

	public Action getAction() {
		return action;
	}

	public UUID getActorUserId() {
		return actorUserId;
	}

	public String getActor() {
		return actor;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
