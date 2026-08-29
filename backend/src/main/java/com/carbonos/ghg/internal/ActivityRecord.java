package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** One measured quantity of an emission-generating activity at a facility. */
@Entity
@Table(name = "ghg_activities")
public class ActivityRecord {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "facility_id", nullable = false)
	private Facility facility;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "emission_factor_id", nullable = false)
	private EmissionFactor emissionFactor;

	@Column(nullable = false, precision = 14, scale = 3)
	private BigDecimal quantity;

	@Column(name = "activity_date", nullable = false)
	private LocalDate activityDate;

	@Column(length = 255)
	private String note;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected ActivityRecord() {
	}

	ActivityRecord(Facility facility, EmissionFactor emissionFactor, BigDecimal quantity, LocalDate activityDate,
			String note) {
		this.id = UUID.randomUUID();
		this.facility = facility;
		this.emissionFactor = emissionFactor;
		this.quantity = quantity;
		this.activityDate = activityDate;
		this.note = note;
	}

	public UUID getId() {
		return id;
	}

	public Facility getFacility() {
		return facility;
	}

	public EmissionFactor getEmissionFactor() {
		return emissionFactor;
	}

	public BigDecimal getQuantity() {
		return quantity;
	}

	public LocalDate getActivityDate() {
		return activityDate;
	}

	public String getNote() {
		return note;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
