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

	// the reporting entity's address and contact for the report header (spec 07.4)
	@Column(length = 255)
	private String address;

	@Column(length = 160)
	private String contact;

	// the next free record number (spec 04.6); read under a row lock when numbers are taken
	@Column(name = "next_record_no", nullable = false)
	private int nextRecordNo = 1;

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

	public String getAddress() {
		return address;
	}

	public String getContact() {
		return contact;
	}

	void setHeader(String address, String contact) {
		this.address = address;
		this.contact = contact;
	}

	public int getNextRecordNo() {
		return nextRecordNo;
	}

	/** Takes {@code count} consecutive record numbers and returns the first (spec 04.6). */
	int allocateRecordNumbers(int count) {
		var first = nextRecordNo;
		nextRecordNo += count;
		return first;
	}

}
