package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

/**
 * An immutable snapshot of one inventory's organizational boundary at the
 * moment it was frozen (spec 007). Every freeze cuts a new, numbered version;
 * runs cite the version they computed from. Entries copy facility names so the
 * record outlives later renames and deletions.
 */
@Entity
@Table(name = "ghg_boundary_versions")
public class BoundaryVersion {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "inventory_id", nullable = false)
	private Inventory inventory;

	@Column(name = "version_no", nullable = false)
	private int versionNo;

	@Enumerated(EnumType.STRING)
	@Column(name = "consolidation_approach", nullable = false, length = 30)
	private ConsolidationApproach consolidationApproach;

	@Column(name = "facility_count", nullable = false)
	private int facilityCount;

	@Column(name = "frozen_by_user_id")
	private UUID frozenByUserId;

	@Column(name = "frozen_by", length = 320)
	private String frozenBy;

	@CreationTimestamp
	@Column(name = "frozen_at", nullable = false, updatable = false)
	private Instant frozenAt;

	@OneToMany(mappedBy = "version", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("facilityName ASC")
	private List<BoundaryVersionEntry> entries = new ArrayList<>();

	protected BoundaryVersion() {
	}

	BoundaryVersion(Inventory inventory, int versionNo, List<BoundaryTreatment> treatments, UUID frozenByUserId,
			String frozenBy) {
		this.id = UUID.randomUUID();
		this.inventory = inventory;
		this.versionNo = versionNo;
		this.consolidationApproach = inventory.getConsolidationApproach();
		this.frozenByUserId = frozenByUserId;
		this.frozenBy = frozenBy;
		for (var treatment : treatments) {
			entries.add(new BoundaryVersionEntry(this, treatment, consolidationApproach));
		}
		this.facilityCount = entries.size();
	}

	/** The share this version recorded for a facility, or empty if it was outside the boundary. */
	public Optional<BigDecimal> shareOf(UUID facilityId) {
		return entries.stream()
			.filter(entry -> entry.getFacilityId().equals(facilityId))
			.map(BoundaryVersionEntry::getAccountingShare)
			.findFirst();
	}

	public UUID getId() {
		return id;
	}

	public Inventory getInventory() {
		return inventory;
	}

	public int getVersionNo() {
		return versionNo;
	}

	public ConsolidationApproach getConsolidationApproach() {
		return consolidationApproach;
	}

	public int getFacilityCount() {
		return facilityCount;
	}

	public UUID getFrozenByUserId() {
		return frozenByUserId;
	}

	public String getFrozenBy() {
		return frozenBy;
	}

	public Instant getFrozenAt() {
		return frozenAt;
	}

	public List<BoundaryVersionEntry> getEntries() {
		return List.copyOf(entries);
	}
}
