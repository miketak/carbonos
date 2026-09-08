package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
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
 * An organizational fact: something that happened at a facility. Carries no
 * scope, category, factor, or accounting treatment — inventories decide those
 * separately via {@link InventoryAssignment} (spec 02, invariant 1).
 */
@Entity
@Table(name = "ghg_activities")
public class ActivityRecord {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "facility_id", nullable = false)
	private Facility facility;

	@Column(name = "activity_type", nullable = false, length = 120)
	private String activityType;

	@Column(nullable = false, precision = 14, scale = 3)
	private BigDecimal quantity;

	@Column(nullable = false, length = 30)
	private String unit;

	@Column(name = "activity_date", nullable = false)
	private LocalDate activityDate;

	@Column(name = "data_source", length = 120)
	private String dataSource;

	@Column(name = "evidence_ref", length = 150)
	private String evidenceRef;

	@Enumerated(EnumType.STRING)
	@Column(name = "data_quality", nullable = false, length = 20)
	private DataQuality dataQuality;

	@Column(length = 255)
	private String note;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected ActivityRecord() {
	}

	ActivityRecord(Facility facility, String activityType, BigDecimal quantity, String unit, LocalDate activityDate,
			String dataSource, String evidenceRef, DataQuality dataQuality, String note) {
		this.id = UUID.randomUUID();
		this.facility = facility;
		this.activityType = activityType;
		this.quantity = quantity;
		this.unit = unit;
		this.activityDate = activityDate;
		this.dataSource = dataSource;
		this.evidenceRef = evidenceRef;
		this.dataQuality = dataQuality;
		this.note = note;
	}

	public UUID getId() {
		return id;
	}

	public Facility getFacility() {
		return facility;
	}

	public String getActivityType() {
		return activityType;
	}

	public BigDecimal getQuantity() {
		return quantity;
	}

	public String getUnit() {
		return unit;
	}

	public LocalDate getActivityDate() {
		return activityDate;
	}

	public String getDataSource() {
		return dataSource;
	}

	public String getEvidenceRef() {
		return evidenceRef;
	}

	public DataQuality getDataQuality() {
		return dataQuality;
	}

	public String getNote() {
		return note;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	/** In-place correction (CORRECT-01); runs snapshot, so history is unaffected. */
	void update(Facility facility, String activityType, BigDecimal quantity, String unit, LocalDate activityDate,
			String dataSource, String evidenceRef, DataQuality dataQuality, String note) {
		this.facility = facility;
		this.activityType = activityType;
		this.quantity = quantity;
		this.unit = unit;
		this.activityDate = activityDate;
		this.dataSource = dataSource;
		this.evidenceRef = evidenceRef;
		this.dataQuality = dataQuality;
		this.note = note;
	}
}
