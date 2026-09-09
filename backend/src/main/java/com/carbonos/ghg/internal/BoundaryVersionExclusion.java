package com.carbonos.ghg.internal;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** An operation a boundary version recorded as excluded, names copied at freeze time (spec 07.2). */
@Entity
@Table(name = "ghg_boundary_version_exclusions")
public class BoundaryVersionExclusion {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "boundary_version_id", nullable = false)
	private BoundaryVersion version;

	@Column(name = "entity_id", nullable = false)
	private UUID entityId;

	@Column(name = "entity_name", nullable = false, length = 120)
	private String entityName;

	@Column(name = "facility_id")
	private UUID facilityId;

	@Column(name = "facility_name", length = 120)
	private String facilityName;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 40)
	private ExclusionReason reason;

	@Column(length = 500)
	private String detail;

	protected BoundaryVersionExclusion() {
	}

	BoundaryVersionExclusion(BoundaryVersion version, BoundaryExclusion exclusion) {
		this.id = UUID.randomUUID();
		this.version = version;
		this.entityId = exclusion.getEntity().getId();
		this.entityName = exclusion.getEntity().getName();
		this.facilityId = exclusion.getFacility() == null ? null : exclusion.getFacility().getId();
		this.facilityName = exclusion.getFacility() == null ? null : exclusion.getFacility().getName();
		this.reason = exclusion.getReason();
		this.detail = exclusion.getDetail();
	}

	public UUID getId() {
		return id;
	}

	public UUID getEntityId() {
		return entityId;
	}

	public String getEntityName() {
		return entityName;
	}

	public UUID getFacilityId() {
		return facilityId;
	}

	public String getFacilityName() {
		return facilityName;
	}

	public ExclusionReason getReason() {
		return reason;
	}

	public String getDetail() {
		return detail;
	}
}
