package com.carbonos.ghg.internal;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** A facility beneath a version entry, name and location copied at freeze time. */
@Entity
@Table(name = "ghg_boundary_version_facilities")
public class BoundaryVersionFacility {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "entry_id", nullable = false)
	private BoundaryVersionEntry entry;

	@Column(name = "facility_id", nullable = false)
	private UUID facilityId;

	@Column(name = "facility_name", nullable = false, length = 120)
	private String facilityName;

	@Column(nullable = false, length = 120)
	private String location;

	protected BoundaryVersionFacility() {
	}

	BoundaryVersionFacility(BoundaryVersionEntry entry, Facility facility) {
		this.id = UUID.randomUUID();
		this.entry = entry;
		this.facilityId = facility.getId();
		this.facilityName = facility.getName();
		this.location = facility.getLocation();
	}

	public UUID getId() {
		return id;
	}

	public UUID getFacilityId() {
		return facilityId;
	}

	public String getFacilityName() {
		return facilityName;
	}

	public String getLocation() {
		return location;
	}
}
