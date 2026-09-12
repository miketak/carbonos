package com.carbonos.ghg.internal;

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
 * One recorded act on an inventory (spec 05.2) or on an organization (spec
 * 01.3): who did what, when, and why. Runs are never deleted and final
 * designations never silently withdrawn; each such act leaves a row here that
 * the inventory page lists. Support access and the organization's deletion
 * leave rows without an inventory that the organization's history lists.
 */
@Entity
@Table(name = "ghg_audit_events")
public class GhgAuditEvent {

	public enum Action {
		RUN_VOIDED, FINAL_WITHDRAWN, CLASSIFIED, REVIEWED, FROZEN, REOPENED, RUN_LAUNCHED, FINAL_DESIGNATED, PUBLISHED,
		CORRECTION_CREATED, HEADER_SAVED, ADMIN_ACCESS_ASSUMED, ADMIN_ACCESS_ENDED, ADMIN_ACCESS_EXPIRED,
		ORGANIZATION_DELETED
	}

	@Id
	private UUID id;

	@Column(name = "organization_id")
	private UUID organizationId;

	@Column(name = "inventory_id")
	private UUID inventoryId;

	@Column(name = "run_id")
	private UUID runId;

	@Column(name = "run_no")
	private Integer runNo;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 40)
	private Action action;

	@Column(name = "actor_user_id")
	private UUID actorUserId;

	@Column(name = "actor", nullable = false, length = 320)
	private String actor;

	@Column(name = "reason", nullable = false, length = 500)
	private String reason;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected GhgAuditEvent() {
	}

	/** An act on an inventory; {@code run} is the run it concerns, if any. */
	GhgAuditEvent(Inventory inventory, GhgRun run, Action action, UUID actorUserId, String actor, String reason) {
		this(inventory.getOrganization().getId(), inventory.getId(), run, action, actorUserId, actor, reason);
	}

	/** An act on the organization itself (spec 01.3): no inventory, no run. */
	GhgAuditEvent(UUID organizationId, Action action, UUID actorUserId, String actor, String reason) {
		this(organizationId, null, null, action, actorUserId, actor, reason);
	}

	private GhgAuditEvent(UUID organizationId, UUID inventoryId, GhgRun run, Action action, UUID actorUserId,
			String actor, String reason) {
		this.id = UUID.randomUUID();
		this.organizationId = organizationId;
		this.inventoryId = inventoryId;
		this.runId = run == null ? null : run.getId();
		this.runNo = run == null ? null : run.getRunNo();
		this.action = action;
		this.actorUserId = actorUserId;
		this.actor = actor;
		this.reason = reason;
	}

	public UUID getId() {
		return id;
	}

	public UUID getOrganizationId() {
		return organizationId;
	}

	public UUID getInventoryId() {
		return inventoryId;
	}

	public UUID getRunId() {
		return runId;
	}

	public Integer getRunNo() {
		return runNo;
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

	public String getReason() {
		return reason;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
