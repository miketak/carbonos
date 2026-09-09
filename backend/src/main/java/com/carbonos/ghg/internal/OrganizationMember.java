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

/** One platform user's membership of an organization, with a role (spec 01.2). */
@Entity
@Table(name = "ghg_organization_members")
public class OrganizationMember {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "organization_id", nullable = false)
	private Organization organization;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	// snapshots of the account, so the list reads without a cross-module lookup
	@Column(nullable = false, length = 320)
	private String email;

	@Column(name = "display_name", nullable = false, length = 100)
	private String displayName;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private OrgRole role;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected OrganizationMember() {
	}

	OrganizationMember(Organization organization, UUID userId, String email, String displayName, OrgRole role) {
		this.id = UUID.randomUUID();
		this.organization = organization;
		this.userId = userId;
		this.email = email;
		this.displayName = displayName;
		this.role = role;
	}

	public UUID getId() {
		return id;
	}

	public Organization getOrganization() {
		return organization;
	}

	public UUID getUserId() {
		return userId;
	}

	public String getEmail() {
		return email;
	}

	public String getDisplayName() {
		return displayName;
	}

	public OrgRole getRole() {
		return role;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	void setRole(OrgRole role) {
		this.role = role;
	}
}
