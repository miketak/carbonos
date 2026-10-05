package com.carbonos.ghg.internal;

import java.time.Instant;
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
 * One source of emissions at a facility (spec 04.3): what is burned, bought,
 * discarded or moved, by which meter or supplier, and whether the company or
 * a contractor operates it. The register is what completeness is checked
 * against, and it drives the default classification of its records.
 */
@Entity
@Table(name = "ghg_source_streams")
public class SourceStream {

	/** Where the source was created: the facility's register page, or the activity form during data entry. */
	public enum Origin {
		REGISTER, INLINE
	}

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "facility_id", nullable = false)
	private Facility facility;

	@Column(nullable = false, length = 120)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 40)
	private StreamKind kind;

	@Column(length = 80)
	private String fuel;

	@Column(name = "meter_or_supplier", length = 120)
	private String meterOrSupplier;

	// a contractor's source is scope 3 unless the company directs its operation (Chapter 4)
	@Column(name = "contractor_operated", nullable = false)
	private boolean contractorOperated;

	@Column(length = 255)
	private String note;

	// spec 04.10: how the source was born, so a verifier can sample the ones created during data entry
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private Origin origin;

	@Column(name = "created_by_user_id")
	private UUID createdByUserId;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected SourceStream() {
	}

	SourceStream(Facility facility, String name, StreamKind kind, String fuel, String meterOrSupplier,
			boolean contractorOperated, String note) {
		this(facility, name, kind, fuel, meterOrSupplier, contractorOperated, note, Origin.REGISTER, null);
	}

	SourceStream(Facility facility, String name, StreamKind kind, String fuel, String meterOrSupplier,
			boolean contractorOperated, String note, Origin origin, UUID createdByUserId) {
		this.id = UUID.randomUUID();
		this.origin = origin;
		this.createdByUserId = createdByUserId;
		this.facility = facility;
		this.name = name;
		this.kind = kind;
		this.fuel = fuel;
		this.meterOrSupplier = meterOrSupplier;
		this.contractorOperated = contractorOperated;
		this.note = note;
	}

	public UUID getId() {
		return id;
	}

	public Facility getFacility() {
		return facility;
	}

	public String getName() {
		return name;
	}

	public StreamKind getKind() {
		return kind;
	}

	public String getFuel() {
		return fuel;
	}

	public String getMeterOrSupplier() {
		return meterOrSupplier;
	}

	public boolean isContractorOperated() {
		return contractorOperated;
	}

	public String getNote() {
		return note;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Origin getOrigin() {
		return origin;
	}

	public UUID getCreatedByUserId() {
		return createdByUserId;
	}

	/** The category a record of this stream defaults to. */
	public ActivityCategory defaultCategory() {
		return kind.defaultCategory(contractorOperated);
	}

	/** The scope a record of this stream defaults to: the default category's. */
	public Scope defaultScope() {
		return defaultCategory().scope();
	}

	void update(String name, StreamKind kind, String fuel, String meterOrSupplier, boolean contractorOperated,
			String note) {
		this.name = name;
		this.kind = kind;
		this.fuel = fuel;
		this.meterOrSupplier = meterOrSupplier;
		this.contractorOperated = contractorOperated;
		this.note = note;
	}
}
