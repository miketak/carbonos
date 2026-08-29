package com.carbonos.ghg.internal;

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

@Entity
@Table(name = "ghg_organizations")
public class Organization {

	@Id
	private UUID id;

	@Column(nullable = false, unique = true, length = 120)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(name = "consolidation_approach", nullable = false, length = 30)
	private ConsolidationApproach consolidationApproach;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected Organization() {
	}

	Organization(String name, ConsolidationApproach consolidationApproach) {
		this.id = UUID.randomUUID();
		this.name = name;
		this.consolidationApproach = consolidationApproach;
	}

	public UUID getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public ConsolidationApproach getConsolidationApproach() {
		return consolidationApproach;
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

	void setConsolidationApproach(ConsolidationApproach consolidationApproach) {
		this.consolidationApproach = consolidationApproach;
	}
}
