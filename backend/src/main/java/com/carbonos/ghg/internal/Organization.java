package com.carbonos.ghg.internal;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "ghg_organizations")
public class Organization {

	@Id
	private UUID id;

	@Column(nullable = false, unique = true, length = 120)
	private String name;

	@Column(name = "owner_user_id")
	private UUID ownerUserId;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected Organization() {
	}

	Organization(String name, UUID ownerUserId) {
		this.id = UUID.randomUUID();
		this.name = name;
		this.ownerUserId = ownerUserId;
	}

	public UUID getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public UUID getOwnerUserId() {
		return ownerUserId;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	void setName(String name) {
		this.name = name;
	}

}
