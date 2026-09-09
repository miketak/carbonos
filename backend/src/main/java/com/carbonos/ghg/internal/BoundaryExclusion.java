package com.carbonos.ghg.internal;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * An operation the accountant deliberately left out of an inventory's
 * boundary, with the reason (spec 07.2, Chapter 9: "any specific exclusions of
 * sources, facilities, and/or operations"). Either a whole entity, covering
 * every facility of it, or one facility of a member entity.
 */
@Entity
@Table(name = "ghg_boundary_exclusions")
public class BoundaryExclusion {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "inventory_id", nullable = false)
	private Inventory inventory;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "entity_id")
	private LegalEntity entity;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "facility_id")
	private Facility facility;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 40)
	private ExclusionReason reason;

	@Column(length = 500)
	private String detail;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected BoundaryExclusion() {
	}

	BoundaryExclusion(Inventory inventory, LegalEntity entity, Facility facility, ExclusionReason reason,
			String detail) {
		this.id = UUID.randomUUID();
		this.inventory = inventory;
		this.entity = entity;
		this.facility = facility;
		this.reason = reason;
		this.detail = detail;
	}

	public UUID getId() {
		return id;
	}

	public Inventory getInventory() {
		return inventory;
	}

	/** The excluded entity, or the entity of the excluded facility. */
	public LegalEntity getEntity() {
		return entity != null ? entity : facility.getEntity();
	}

	public Facility getFacility() {
		return facility;
	}

	public boolean isWholeEntity() {
		return facility == null;
	}

	public ExclusionReason getReason() {
		return reason;
	}

	public String getDetail() {
		return detail;
	}

	void update(ExclusionReason reason, String detail) {
		this.reason = reason;
		this.detail = detail;
	}
}
