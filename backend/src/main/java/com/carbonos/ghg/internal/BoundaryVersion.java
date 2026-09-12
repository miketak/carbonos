package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
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
import jakarta.persistence.Table;

/**
 * An immutable snapshot of one inventory's organizational boundary at the
 * moment it was frozen (spec 03). Every freeze cuts a new, numbered version;
 * runs cite the version they computed from. Entries copy entity and facility
 * names so the record outlives later renames and deletions. An entity whose
 * share is zero under the approach is recorded as excluded, with the reason,
 * rather than as a member contributing nothing (spec 05.1).
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

	@Column(name = "entity_count", nullable = false)
	private int entityCount;

	@Column(name = "facility_count", nullable = false)
	private int facilityCount;

	@Column(name = "frozen_by_user_id")
	private UUID frozenByUserId;

	@Column(name = "frozen_by", length = 320)
	private String frozenBy;

	@CreationTimestamp
	@Column(name = "frozen_at", nullable = false, updatable = false)
	private Instant frozenAt;

	// spec 05.5: the reopen that superseded this version, with its reason; null while the version is current
	@Column(name = "reopened_by_user_id")
	private UUID reopenedByUserId;

	@Column(name = "reopened_by", length = 320)
	private String reopenedBy;

	@Column(name = "reopened_at")
	private Instant reopenedAt;

	@Column(name = "reopen_reason", length = 500)
	private String reopenReason;

	// a Set: the version is read with its entries and their facilities in one
	// join-fetch, and a bag would repeat each entry once per facility
	@OneToMany(mappedBy = "version", cascade = CascadeType.ALL, orphanRemoval = true)
	private Set<BoundaryVersionEntry> entries = new LinkedHashSet<>();

	// the operations deliberately left out, with their reasons (spec 07.2)
	@OneToMany(mappedBy = "version", cascade = CascadeType.ALL, orphanRemoval = true)
	private Set<BoundaryVersionExclusion> exclusions = new LinkedHashSet<>();

	protected BoundaryVersion() {
	}

	BoundaryVersion(Inventory inventory, int versionNo, List<BoundaryTreatment> treatments,
			java.util.function.Function<BoundaryTreatment, EntityChain> chains, List<BoundaryExclusion> excluded,
			UUID frozenByUserId, String frozenBy) {
		this.id = UUID.randomUUID();
		this.inventory = inventory;
		this.versionNo = versionNo;
		this.consolidationApproach = inventory.getConsolidationApproach();
		this.frozenByUserId = frozenByUserId;
		this.frozenBy = frozenBy;
		for (var treatment : treatments) {
			entries.add(new BoundaryVersionEntry(this, treatment, consolidationApproach, chains.apply(treatment)));
		}
		for (var exclusion : excluded) {
			exclusions.add(new BoundaryVersionExclusion(this, exclusion));
		}
		this.entityCount = (int) entries.stream().filter(entry -> !entry.isExcluded()).count();
		this.facilityCount = entries.stream()
			.filter(entry -> !entry.isExcluded())
			.mapToInt(entry -> entry.getFacilities().size())
			.sum();
	}

	/**
	 * The share this version recorded for a facility on a date, or empty if the
	 * facility was outside the boundary: not recorded, recorded as excluded, or
	 * outside its entity's membership window.
	 */
	public Optional<BigDecimal> shareOf(UUID facilityId, LocalDate date) {
		return entries.stream()
			.filter(entry -> !entry.isExcluded() && entry.holds(facilityId) && entry.covers(date))
			.map(BoundaryVersionEntry::getAccountingShare)
			.findFirst();
	}

	/** The share a facility carries over a record's period, and how many of the record's days the version covers (spec 04.2). */
	public record Coverage(BigDecimal share, long coveredDays, long totalDays) {
	}

	public Coverage coverage(UUID facilityId, LocalDate start, LocalDate end, LocalDate inventoryStart,
			LocalDate inventoryEnd) {
		var record = new DatePeriod(start, end);
		var holder = entries.stream().filter(entry -> !entry.isExcluded() && entry.holds(facilityId)).findFirst();
		if (holder.isEmpty()) {
			return new Coverage(BigDecimal.ZERO, 0, record.days());
		}
		var entry = holder.get();
		var inside = record.clip(inventoryStart, inventoryEnd);
		var covered = inside == null ? null : inside.clip(entry.getEffectiveFrom(), entry.getEffectiveTo());
		return new Coverage(entry.getAccountingShare(), covered == null ? 0 : covered.days(), record.days());
	}

	/** Every facility id a version recorded as a member (excluded entries aside). */
	public List<UUID> memberFacilityIds() {
		return entries.stream()
			.filter(entry -> !entry.isExcluded())
			.flatMap(entry -> entry.getFacilities().stream())
			.map(BoundaryVersionFacility::getFacilityId)
			.toList();
	}

	public Optional<BoundaryVersionEntry> entryHolding(UUID facilityId) {
		return entries.stream().filter(entry -> entry.holds(facilityId)).findFirst();
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

	public int getEntityCount() {
		return entityCount;
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

	/** Records the reopen that supersedes this version: who, when, and why (spec 05.5). */
	void recordReopen(UUID userId, String email, String reason) {
		this.reopenedByUserId = userId;
		this.reopenedBy = email;
		this.reopenedAt = Instant.now();
		this.reopenReason = reason;
	}

	public UUID getReopenedByUserId() {
		return reopenedByUserId;
	}

	public String getReopenedBy() {
		return reopenedBy;
	}

	public Instant getReopenedAt() {
		return reopenedAt;
	}

	public String getReopenReason() {
		return reopenReason;
	}

	/** The operations this version recorded as left out, entity name then facility name. */
	public List<BoundaryVersionExclusion> getExclusions() {
		return exclusions.stream()
			.sorted(Comparator.comparing(BoundaryVersionExclusion::getEntityName)
				.thenComparing(exclusion -> exclusion.getFacilityName() == null ? "" : exclusion.getFacilityName()))
			.toList();
	}

	/** Alphabetical by entity, whether freshly built or loaded, so every reader sees the same order. */
	public List<BoundaryVersionEntry> getEntries() {
		return entries.stream().sorted(Comparator.comparing(BoundaryVersionEntry::getEntityName)).toList();
	}
}
