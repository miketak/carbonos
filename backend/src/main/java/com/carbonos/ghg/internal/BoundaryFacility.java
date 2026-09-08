package com.carbonos.ghg.internal;

import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** One facility included beneath an entity's boundary treatment (spec 03.1). */
@Entity
@Table(name = "ghg_boundary_facilities")
public class BoundaryFacility {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "treatment_id", nullable = false)
	private BoundaryTreatment treatment;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "facility_id", nullable = false)
	private Facility facility;

	protected BoundaryFacility() {
	}

	BoundaryFacility(BoundaryTreatment treatment, Facility facility) {
		this.id = UUID.randomUUID();
		this.treatment = treatment;
		this.facility = facility;
	}

	public UUID getId() {
		return id;
	}

	public BoundaryTreatment getTreatment() {
		return treatment;
	}

	public Facility getFacility() {
		return facility;
	}
}
