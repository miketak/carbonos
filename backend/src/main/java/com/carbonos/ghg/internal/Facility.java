package com.carbonos.ghg.internal;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

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

	// ISO 3166-1 alpha-2, for the report's country breakdown (spec 07.4); optional
	@Column(length = 2)
	private String country;

	// spec 03.4: the grid the facility draws from (ISO 3166-1 alpha-3 or "US-<eGRID subregion>"), what
	// the facility is, and a lease that its records inherit
	@Column(name = "grid_region", length = 40)
	private String gridRegion;

	@Enumerated(EnumType.STRING)
	@Column(name = "facility_type", length = 30)
	private FacilityType facilityType;

	@Enumerated(EnumType.STRING)
	@Column(name = "lease_type", length = 30)
	private LeaseType leaseType;

	@Column(name = "lease_from")
	private LocalDate leaseFrom;

	@Column(name = "lease_to")
	private LocalDate leaseTo;

	// a removed row stays as a tombstone: who removed it, when and why (spec 04.4)
	@Column(name = "deleted_at")
	private Instant deletedAt;

	@Column(name = "deleted_by", length = 320)
	private String deletedBy;

	@Column(name = "delete_reason", length = 500)
	private String deleteReason;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected Facility() {
	}

	Facility(Organization organization, LegalEntity entity, String name, String location, String country) {
		this.id = UUID.randomUUID();
		this.organization = organization;
		this.entity = entity;
		this.name = name;
		this.location = location;
		this.country = country;
	}

	public String getCountry() {
		return country;
	}

	public String getGridRegion() {
		return gridRegion;
	}

	public FacilityType getFacilityType() {
		return facilityType;
	}

	public LeaseType getLeaseType() {
		return leaseType;
	}

	public LocalDate getLeaseFrom() {
		return leaseFrom;
	}

	public LocalDate getLeaseTo() {
		return leaseTo;
	}

	/** The grid region the facility's location-based factor should serve: its own, else its country's alpha-3 code. */
	public String effectiveGridRegion() {
		if (gridRegion != null) {
			return gridRegion;
		}
		if (country == null) {
			return null;
		}
		try {
			return java.util.Locale.of("", country).getISO3Country();
		}
		catch (java.util.MissingResourceException ex) {
			return null;
		}
	}

	/** The lease the facility is under on a period, or null when none applies (spec 03.4). */
	public LeaseType leaseOver(LocalDate start, LocalDate end) {
		if (leaseType == null) {
			return null;
		}
		var overlaps = (leaseFrom == null || !end.isBefore(leaseFrom)) && (leaseTo == null || !start.isAfter(leaseTo));
		return overlaps ? leaseType : null;
	}

	void setAttributes(String gridRegion, FacilityType facilityType, LeaseType leaseType, LocalDate leaseFrom,
			LocalDate leaseTo) {
		this.gridRegion = gridRegion;
		this.facilityType = facilityType;
		this.leaseType = leaseType;
		this.leaseFrom = leaseFrom;
		this.leaseTo = leaseTo;
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

	public boolean isDeleted() {
		return deletedAt != null;
	}

	public Instant getDeletedAt() {
		return deletedAt;
	}

	public String getDeletedBy() {
		return deletedBy;
	}

	public String getDeleteReason() {
		return deleteReason;
	}

	void markRemoved(String by, String reason) {
		this.deletedAt = Instant.now();
		this.deletedBy = by;
		this.deleteReason = reason;
	}

	void update(LegalEntity entity, String name, String location, String country) {
		this.entity = entity;
		this.name = name;
		this.location = location;
		this.country = country;
	}
}
