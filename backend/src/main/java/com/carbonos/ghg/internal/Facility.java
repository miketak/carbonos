package com.carbonos.ghg.internal;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * A site the organization reports on. Ownership and control facts live on
 * the facility's {@link LegalEntity} (spec 03.1), so a facility is only a
 * name, a location and the entity it belongs to.
 */
@Entity
@Table(name = "ghg_facilities")
public class Facility {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "organization_id", nullable = false)
	private Organization organization;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "entity_id", nullable = false)
	private LegalEntity entity;

	@Column(nullable = false, length = 120)
	private String name;

	@Column(nullable = false, length = 120)
	private String location;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected Facility() {
	}

	Facility(Organization organization, LegalEntity entity, String name, String location) {
		this.id = UUID.randomUUID();
		this.organization = organization;
		this.entity = entity;
		this.name = name;
		this.location = location;
	}

	public UUID getId() {
		return id;
	}

	public Organization getOrganization() {
		return organization;
	}

	public LegalEntity getEntity() {
		return entity;
	}

	public String getName() {
		return name;
	}

	public String getLocation() {
		return location;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	void update(LegalEntity entity, String name, String location) {
		this.entity = entity;
		this.name = name;
		this.location = location;
	}
}
