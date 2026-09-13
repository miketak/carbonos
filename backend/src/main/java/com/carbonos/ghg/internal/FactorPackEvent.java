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
 * The publication trail of one edition (spec 02.5): who attached the evidence,
 * who published, which edition a publication superseded, and who withdrew one.
 *
 * <p>It is not {@code ghg_audit_events}: {@code chk_ghg_audit_events_subject}
 * requires an organization or an inventory on every audit event and an edition
 * belongs to neither. The tenant-side acts of spec 02.7 do belong to an
 * organization, so those use {@link GhgAuditEvent}.
 */
@Entity
@Table(name = "ghg_factor_pack_events")
public class FactorPackEvent {

	public enum Action {

		/** A source document was uploaded against the draft, with its checksum. */
		EVIDENCE_ATTACHED,

		/** The edition was published: frozen, importable, its change log written. */
		PUBLISHED,

		/** A successor was published, so this edition left the import list. */
		SUPERSEDED,

		/** The edition was withdrawn with a reason. */
		WITHDRAWN
	}

	@Id
	private UUID id;

	@Column(name = "edition_id", nullable = false, length = 60)
	private String editionId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private Action action;

	@Column(name = "actor_user_id")
	private UUID actorUserId;

	@Column(name = "actor_email", length = 320)
	private String actorEmail;

	@Column(length = 1000)
	private String detail;

	@CreationTimestamp
	@Column(name = "occurred_at", nullable = false, updatable = false)
	private Instant occurredAt;

	protected FactorPackEvent() {
	}

	FactorPackEvent(String editionId, Action action, UUID actorUserId, String actorEmail, String detail) {
		this.id = UUID.randomUUID();
		this.editionId = editionId;
		this.action = action;
		this.actorUserId = actorUserId;
		this.actorEmail = actorEmail;
		this.detail = detail == null || detail.length() <= 1000 ? detail : detail.substring(0, 997) + "...";
	}

	public UUID getId() {
		return id;
	}

	public String getEditionId() {
		return editionId;
	}

	public Action getAction() {
		return action;
	}

	public UUID getActorUserId() {
		return actorUserId;
	}

	public String getActorEmail() {
		return actorEmail;
	}

	public String getDetail() {
		return detail;
	}

	public Instant getOccurredAt() {
		return occurredAt;
	}
}
