package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

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
 * An organization's base year (spec 06, 06.1, Chapter 5): the inventory that
 * established it, the reason it was chosen, and the recalculation policy: the
 * significance threshold, applied to each change and to the cumulative effect
 * of changes since the base year, and the convention for mid-year structural
 * changes. Every policy honors all three of the Standard's triggers.
 */
@Entity
@Table(name = "ghg_base_years")
public class BaseYear {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "organization_id", nullable = false)
	private Organization organization;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "inventory_id", nullable = false)
	private Inventory inventory;

	@Column(name = "threshold_percent", nullable = false, precision = 5, scale = 2)
	private BigDecimal thresholdPercent;

	// why this year: "a base year for which verifiable emissions data are available" (Chapter 5)
	@Column(nullable = false, length = 500)
	private String reason;

	@Enumerated(EnumType.STRING)
	@Column(name = "structural_change_convention", nullable = false, length = 20)
	private StructuralChangeConvention structuralChangeConvention;

	@OneToMany(mappedBy = "baseYear", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("createdAt ASC")
	private List<BaseYearRecalculation> recalculations = new ArrayList<>();

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected BaseYear() {
	}

	BaseYear(Organization organization, Inventory inventory, BigDecimal thresholdPercent, String reason,
			StructuralChangeConvention convention) {
		this.id = UUID.randomUUID();
		this.organization = organization;
		this.inventory = inventory;
		this.thresholdPercent = thresholdPercent;
		this.reason = reason;
		this.structuralChangeConvention = convention;
	}

	public UUID getId() {
		return id;
	}

	public Organization getOrganization() {
		return organization;
	}

	public Inventory getInventory() {
		return inventory;
	}

	public BigDecimal getThresholdPercent() {
		return thresholdPercent;
	}

	public String getReason() {
		return reason;
	}

	public StructuralChangeConvention getStructuralChangeConvention() {
		return structuralChangeConvention;
	}

	/** The base year as a calendar year: the year the base-year inventory's period starts. */
	public int year() {
		return inventory.getPeriodStart().getYear();
	}

	public List<BaseYearRecalculation> getRecalculations() {
		return List.copyOf(recalculations);
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	void update(Inventory inventory, BigDecimal thresholdPercent, String reason,
			StructuralChangeConvention convention) {
		this.inventory = inventory;
		this.thresholdPercent = thresholdPercent;
		this.reason = reason;
		this.structuralChangeConvention = convention;
	}

	/**
	 * The candidates that still weigh on the base year: every undecided one,
	 * and every declined one raised since the last recalculated base. A
	 * recalculation resets the running sum; a refusal does not.
	 */
	List<BaseYearRecalculation> outstanding() {
		var lastRecalculated = recalculations.stream()
			.filter(candidate -> candidate.getStatus() == RecalculationStatus.RECALCULATED)
			.map(BaseYearRecalculation::getDecidedAt)
			.filter(java.util.Objects::nonNull)
			.max(java.util.Comparator.naturalOrder());
		return recalculations.stream()
			.filter(candidate -> candidate.getStatus() == RecalculationStatus.FLAGGED
					|| (candidate.getStatus() == RecalculationStatus.DECLINED && (lastRecalculated.isEmpty()
							|| candidate.getCreatedAt() == null || candidate.getCreatedAt().isAfter(lastRecalculated.get()))))
			.toList();
	}

	/**
	 * Records a candidate, weighing it on its own and together with the
	 * outstanding candidates (Chapter 5: "the cumulative effect of a number of
	 * minor structural changes can result in a significant impact").
	 */
	BaseYearRecalculation flag(RecalculationTrigger trigger, String what, Inventory triggeringInventory,
			BoundaryVersion version, BigDecimal affectedPercent, String raisedBy) {
		var earlier = outstanding();
		var cumulative = earlier.stream()
			.map(BaseYearRecalculation::getAffectedPercent)
			.filter(java.util.Objects::nonNull)
			.reduce(affectedPercent, BigDecimal::add);
		var above = affectedPercent.compareTo(thresholdPercent) > 0 || cumulative.compareTo(thresholdPercent) > 0;
		var threshold = thresholdPercent.stripTrailingZeros().toPlainString();
		var reason = what + "; " + affectedPercent.stripTrailingZeros().toPlainString()
				+ "% of base-year emissions"
				+ (earlier.isEmpty() ? ""
						: " on its own, " + cumulative.stripTrailingZeros().toPlainString() + "% together with "
								+ earlier.size() + " earlier change" + (earlier.size() == 1 ? "" : "s") + " since the "
								+ year() + " base year")
				+ ", " + (above ? "above" : "below") + " the " + threshold + "% threshold, recalculation "
				+ (above ? "required" : "optional");
		var recalculation = new BaseYearRecalculation(this, trigger, reason, triggeringInventory, version,
				affectedPercent, cumulative, above, raisedBy);
		recalculations.add(recalculation);
		return recalculation;
	}

	boolean hasUnresolvedFlag() {
		return recalculations.stream().anyMatch(r -> r.getStatus() == RecalculationStatus.FLAGGED);
	}
}
