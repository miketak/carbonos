package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
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

	// the organization, denormalized from the facility (a correction never moves a record across
	// organizations), so the record number is unique per organization (spec 04.6)
	@Column(name = "organization_id", nullable = false, updatable = false)
	private UUID organizationId;

	// the human-readable number, ACT-0001 in the UI and the exports; never reused (spec 04.6)
	@Column(name = "record_no", nullable = false, updatable = false)
	private int recordNo;

	// a draft is a hand-entered stub that may still lack quantity, unit or period (spec 04.6)
	@Column(nullable = false)
	private boolean draft;

	// the CSV import the record came from and its row in that file (spec 04.6)
	@Column(name = "import_batch_id", updatable = false)
	private UUID importBatchId;

	@Column(name = "import_row", updatable = false)
	private Integer importRow;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "facility_id", nullable = false)
	private Facility facility;

	@Column(name = "activity_type", nullable = false, length = 120)
	private String activityType;

	// the source stream the record belongs to (spec 04.3); optional
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "stream_id")
	private SourceStream stream;

	// null only on a draft (spec 04.6); the database checks that a fact carries all four
	@Column(precision = 14, scale = 3)
	private BigDecimal quantity;

	@Column(length = 30)
	private String unit;

	// the period the quantity was consumed or emitted over (spec 04.2); a reading is a one-day period
	@Column(name = "period_start")
	private LocalDate periodStart;

	@Column(name = "period_end")
	private LocalDate periodEnd;

	@Column(name = "data_source", length = 120)
	private String dataSource;

	@Column(name = "evidence_ref", length = 150)
	private String evidenceRef;

	@Enumerated(EnumType.STRING)
	@Column(name = "data_quality", nullable = false, length = 20)
	private DataQuality dataQuality;

	@Column(length = 255)
	private String note;

	// the data quality tier, 1 (metered primary data) to 5 (assumption), and the uncertainty the
	// accountant attaches to the figure (spec 04.4)
	@Column(name = "data_quality_tier", nullable = false)
	private int dataQualityTier;

	@Column(name = "uncertainty_percent", precision = 6, scale = 2)
	private BigDecimal uncertaintyPercent;

	// a removed record stays as a tombstone: who removed it, when and why (spec 04.4)
	@Column(name = "deleted_at")
	private Instant deletedAt;

	@Column(name = "deleted_by", length = 320)
	private String deletedBy;

	@Column(name = "delete_reason", length = 500)
	private String deleteReason;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected ActivityRecord() {
	}

	ActivityRecord(int recordNo, boolean draft, Facility facility, SourceStream stream, String activityType,
			BigDecimal quantity, String unit, LocalDate periodStart, LocalDate periodEnd, String dataSource,
			String evidenceRef, DataQuality dataQuality, String note, Integer dataQualityTier,
			BigDecimal uncertaintyPercent) {
		this.id = UUID.randomUUID();
		this.organizationId = facility.getOrganization().getId();
		this.recordNo = recordNo;
		this.draft = draft;
		this.dataQualityTier = dataQualityTier == null ? DataQualityTier.defaultFor(dataQuality) : dataQualityTier;
		this.uncertaintyPercent = uncertaintyPercent;
		this.facility = facility;
		this.stream = stream;
		this.activityType = activityType;
		this.quantity = quantity;
		this.unit = unit;
		this.periodStart = periodStart;
		this.periodEnd = periodEnd;
		this.dataSource = dataSource;
		this.evidenceRef = evidenceRef;
		this.dataQuality = dataQuality;
		this.note = note;
	}

	public UUID getId() {
		return id;
	}

	public UUID getOrganizationId() {
		return organizationId;
	}

	public int getRecordNo() {
		return recordNo;
	}

	/** The number as the UI and the exports print it: {@code ACT-0001}. */
	public String getRecordRef() {
		return ref(recordNo);
	}

	public static String ref(Integer recordNo) {
		return recordNo == null ? "" : String.format("ACT-%04d", recordNo);
	}

	public boolean isDraft() {
		return draft;
	}

	public UUID getImportBatchId() {
		return importBatchId;
	}

	public Integer getImportRow() {
		return importRow;
	}

	void fromImport(UUID batchId, int row) {
		this.importBatchId = batchId;
		this.importRow = row;
	}

	public Facility getFacility() {
		return facility;
	}

	public String getActivityType() {
		return activityType;
	}

	public SourceStream getStream() {
		return stream;
	}

	public BigDecimal getQuantity() {
		return quantity;
	}

	public String getUnit() {
		return unit;
	}

	public LocalDate getPeriodStart() {
		return periodStart;
	}

	public LocalDate getPeriodEnd() {
		return periodEnd;
	}

	/** The period, or null on a draft that has none yet. */
	DatePeriod period() {
		return periodStart == null || periodEnd == null ? null : new DatePeriod(periodStart, periodEnd);
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

	public int getDataQualityTier() {
		return dataQualityTier;
	}

	public BigDecimal getUncertaintyPercent() {
		return uncertaintyPercent;
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

	/** Leaves the record as a tombstone (spec 04.4): reviews exclude it, nothing reads it as a fact again. */
	void markRemoved(String by, String reason) {
		this.deletedAt = Instant.now();
		this.deletedBy = by;
		this.deleteReason = reason;
	}

	/** One field's old and new value in a correction (spec 04.4). */
	public record Change(String field, String before, String after) {
	}

	/** The fields a correction would change, before it is applied, for the revision history. */
	List<Change> changesTo(boolean draft, Facility facility, SourceStream stream, String activityType,
			BigDecimal quantity, String unit, LocalDate periodStart, LocalDate periodEnd, String dataSource,
			String evidenceRef, DataQuality dataQuality, String note, int dataQualityTier,
			BigDecimal uncertaintyPercent) {
		var changes = new ArrayList<Change>();
		diff(changes, "draft", String.valueOf(this.draft), String.valueOf(draft));
		diff(changes, "facility", this.facility.getName(), facility.getName());
		diff(changes, "stream", this.stream == null ? null : this.stream.getName(), stream == null ? null : stream.getName());
		diff(changes, "activityType", this.activityType, activityType);
		diff(changes, "quantity", plain(this.quantity), plain(quantity));
		diff(changes, "unit", this.unit, unit);
		diff(changes, "periodStart", text(this.periodStart), text(periodStart));
		diff(changes, "periodEnd", text(this.periodEnd), text(periodEnd));
		diff(changes, "dataSource", this.dataSource, dataSource);
		diff(changes, "evidenceRef", this.evidenceRef, evidenceRef);
		diff(changes, "dataQuality", this.dataQuality.name(), dataQuality.name());
		diff(changes, "dataQualityTier", String.valueOf(this.dataQualityTier), String.valueOf(dataQualityTier));
		diff(changes, "uncertaintyPercent", plain(this.uncertaintyPercent), plain(uncertaintyPercent));
		diff(changes, "note", this.note, note);
		return changes;
	}

	private static void diff(List<Change> changes, String field, String before, String after) {
		if (!Objects.equals(before, after)) {
			changes.add(new Change(field, before, after));
		}
	}

	private static String plain(BigDecimal value) {
		return value == null ? null : value.stripTrailingZeros().toPlainString();
	}

	private static String text(Object value) {
		return value == null ? null : value.toString();
	}

	/** Every field as a value, for the revision that records a draft's entry as a fact (spec 04.6). */
	List<Change> entered() {
		var changes = new ArrayList<Change>();
		changes.add(new Change("draft", "true", "false"));
		diff(changes, "stream", null, this.stream == null ? null : this.stream.getName());
		diff(changes, "activityType", null, this.activityType);
		diff(changes, "quantity", null, plain(this.quantity));
		diff(changes, "unit", null, this.unit);
		diff(changes, "periodStart", null, text(this.periodStart));
		diff(changes, "periodEnd", null, text(this.periodEnd));
		diff(changes, "dataSource", null, this.dataSource);
		diff(changes, "evidenceRef", null, this.evidenceRef);
		diff(changes, "dataQuality", null, this.dataQuality.name());
		diff(changes, "dataQualityTier", null, String.valueOf(this.dataQualityTier));
		diff(changes, "uncertaintyPercent", null, plain(this.uncertaintyPercent));
		diff(changes, "note", null, this.note);
		return changes;
	}

	/** In-place correction (CORRECT-01); runs snapshot, so history is unaffected. */
	void update(boolean draft, Facility facility, SourceStream stream, String activityType, BigDecimal quantity,
			String unit, LocalDate periodStart, LocalDate periodEnd, String dataSource, String evidenceRef,
			DataQuality dataQuality, String note, int dataQualityTier, BigDecimal uncertaintyPercent) {
		this.draft = draft;
		this.dataQualityTier = dataQualityTier;
		this.uncertaintyPercent = uncertaintyPercent;
		this.facility = facility;
		this.stream = stream;
		this.activityType = activityType;
		this.quantity = quantity;
		this.unit = unit;
		this.periodStart = periodStart;
		this.periodEnd = periodEnd;
		this.dataSource = dataSource;
		this.evidenceRef = evidenceRef;
		this.dataQuality = dataQuality;
		this.note = note;
	}
}
