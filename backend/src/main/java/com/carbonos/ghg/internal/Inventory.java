package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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
 * A GHG inventory: an accounting view over the organization's activity facts
 * for one reporting period under one consolidation approach. It owns the
 * boundary treatments and activity assignments, never the facts themselves
 * (spec 05), and has one lifecycle covering both halves (spec 05.1).
 */
@Entity
@Table(name = "ghg_inventories")
public class Inventory {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "organization_id", nullable = false)
	private Organization organization;

	@Column(nullable = false, length = 120)
	private String name;

	@Column(name = "period_start", nullable = false)
	private LocalDate periodStart;

	@Column(name = "period_end", nullable = false)
	private LocalDate periodEnd;

	@Column(length = 255)
	private String purpose;

	@Column(name = "base_year")
	private Integer baseYear;

	@Enumerated(EnumType.STRING)
	@Column(name = "consolidation_approach", nullable = false, length = 30)
	private ConsolidationApproach consolidationApproach;

	@Enumerated(EnumType.STRING)
	@Column(name = "gwp_set", nullable = false, length = 5)
	private GwpSet gwpSet;

	// the operational boundary declaration (spec 07.1): scope 3 categories covered, as a comma list
	@Column(name = "scope3_categories")
	private String scope3Categories;

	@Column(name = "scope3_exclusions_rationale", length = 1000)
	private String scope3ExclusionsRationale;

	// spec 07.6: declared categories not quantified this year, with the reason: "CATEGORY|reason" lines
	@Column(name = "scope3_not_quantified", columnDefinition = "text")
	private String scope3NotQuantified;

	// Scope 2 Guidance (spec 07.2): whether an adjusted residual mix is available for the markets the
	// instruments sit in, and its factor when it is; null until the accountant says
	@Column(name = "residual_mix_available")
	private Boolean residualMixAvailable;

	@Column(name = "residual_mix_kg_co2e_per_kwh", precision = 12, scale = 6)
	private BigDecimal residualMixKgCo2ePerKwh;

	// what to do with a record that straddles the period or a membership window (spec 04.2)
	@Enumerated(EnumType.STRING)
	@Column(name = "straddle_treatment", nullable = false, length = 10)
	private StraddleTreatment straddleTreatment;

	@Column(name = "final_run_id")
	private UUID finalRunId;

	// the report header (spec 07.4): the approver override, who published, and the assurance
	@Column(name = "approved_by", length = 160)
	private String approvedBy;

	@Column(name = "published_by", length = 320)
	private String publishedBy;

	@Enumerated(EnumType.STRING)
	@Column(name = "assurance_level", nullable = false, length = 12)
	private AssuranceLevel assuranceLevel;

	@Column(name = "assurance_provider", length = 160)
	private String assuranceProvider;

	@Column(name = "assurance_statement", length = 255)
	private String assuranceStatement;

	// the qualitative uncertainty statement printed with the data-quality table (spec 04.4)
	@Column(name = "uncertainty_statement", length = 1000)
	private String uncertaintyStatement;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private InventoryStatus status;

	@Column(name = "superseded_by_id")
	private UUID supersededById;

	// spec 05.3: the inventory this one copied its view from, why a correction was made, and the
	// report exactly as it was published
	@Column(name = "copied_from_id")
	private UUID copiedFromId;

	@Column(name = "correction_reason", length = 1000)
	private String correctionReason;

	@Column(name = "published_report", columnDefinition = "text")
	private String publishedReport;

	// spec 05.4: what a copy across approaches did (boundary rebuilt, leases re-derived, exclusions dropped), as JSON
	@Column(name = "inheritance_notes", columnDefinition = "text")
	private String inheritanceNotes;

	// spec 05.5: who designated the final run, when, and the reviewer's note
	@Column(name = "final_designated_by", length = 320)
	private String finalDesignatedBy;

	@Column(name = "final_designated_at")
	private Instant finalDesignatedAt;

	@Column(name = "final_note", length = 500)
	private String finalNote;

	// spec 05.8: the sign-off as an account, and whether nobody else in the organization could check it
	@Column(name = "final_designated_by_user_id")
	private UUID finalDesignatedByUserId;

	@Column(name = "final_designated_by_name", length = 160)
	private String finalDesignatedByName;

	@Column(name = "final_self_approved", nullable = false)
	private boolean finalSelfApproved;

	// spec 05.8: the named preparer and approver, who narrow who may act within the organization roles
	@Column(name = "preparer_user_id")
	private UUID preparerUserId;

	@Column(name = "preparer_email", length = 320)
	private String preparerEmail;

	@Column(name = "preparer_name", length = 160)
	private String preparerName;

	@Column(name = "approver_user_id")
	private UUID approverUserId;

	@Column(name = "approver_email", length = 320)
	private String approverEmail;

	@Column(name = "approver_name", length = 160)
	private String approverName;

	// spec 05.8: the run submitted for review, by whom, when, and the note for the approver; kept once
	// the run is signed off, so the report names who prepared it
	@Column(name = "submitted_run_id")
	private UUID submittedRunId;

	@Column(name = "submitted_by_user_id")
	private UUID submittedByUserId;

	@Column(name = "submitted_by", length = 320)
	private String submittedBy;

	@Column(name = "submitted_by_name", length = 160)
	private String submittedByName;

	@Column(name = "submitted_at")
	private Instant submittedAt;

	@Column(name = "submit_note", length = 500)
	private String submitNote;

	@Column(name = "published_at")
	private Instant publishedAt;

	// plain columns, like finalRunId, so responses never lazy-load (spec 03)
	@Column(name = "current_boundary_version_id")
	private UUID currentBoundaryVersionId;

	@Column(name = "current_boundary_version_no")
	private Integer currentBoundaryVersionNo;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected Inventory() {
	}

	Inventory(Organization organization, String name, LocalDate periodStart, LocalDate periodEnd, String purpose,
			Integer baseYear, ConsolidationApproach consolidationApproach, GwpSet gwpSet,
			StraddleTreatment straddleTreatment) {
		this.id = UUID.randomUUID();
		this.organization = organization;
		this.name = name;
		this.periodStart = periodStart;
		this.periodEnd = periodEnd;
		this.purpose = purpose;
		this.baseYear = baseYear;
		this.consolidationApproach = consolidationApproach;
		this.gwpSet = gwpSet;
		this.straddleTreatment = straddleTreatment;
		this.assuranceLevel = AssuranceLevel.UNVERIFIED;
		this.status = InventoryStatus.DRAFT;
	}

	public String getApprovedBy() {
		return approvedBy;
	}

	public String getPublishedBy() {
		return publishedBy;
	}

	public AssuranceLevel getAssuranceLevel() {
		return assuranceLevel;
	}

	public String getAssuranceProvider() {
		return assuranceProvider;
	}

	public String getAssuranceStatement() {
		return assuranceStatement;
	}

	public String getUncertaintyStatement() {
		return uncertaintyStatement;
	}

	/** The typed header (spec 07.4). The approver is no longer typed: the sign-off names it (spec 05.8). */
	void setReportMetadata(AssuranceLevel assuranceLevel, String assuranceProvider, String assuranceStatement,
			String uncertaintyStatement) {
		this.uncertaintyStatement = uncertaintyStatement;
		this.assuranceLevel = assuranceLevel;
		this.assuranceProvider = assuranceProvider;
		this.assuranceStatement = assuranceStatement;
	}

	public StraddleTreatment getStraddleTreatment() {
		return straddleTreatment;
	}

	void setStraddleTreatment(StraddleTreatment straddleTreatment) {
		this.straddleTreatment = straddleTreatment;
	}

	/** "2025" for a period inside one calendar year, else a fiscal-year label such as "FY2025/26" (spec 04.2). */
	public String periodLabel() {
		if (periodStart.getYear() == periodEnd.getYear()) {
			return String.valueOf(periodStart.getYear());
		}
		return "FY" + periodStart.getYear() + "/" + String.format("%02d", periodEnd.getYear() % 100);
	}

	/** Whole months in the period, or -1 when it is not a whole number of months. */
	public long months() {
		var monthsBetween = java.time.temporal.ChronoUnit.MONTHS.between(periodStart, periodEnd.plusDays(1));
		return periodStart.plusMonths(monthsBetween).equals(periodEnd.plusDays(1)) ? monthsBetween : -1;
	}

	/** Whether a record's period overlaps the reporting period at all (spec 04.2). */
	boolean overlaps(LocalDate start, LocalDate end) {
		return !end.isBefore(periodStart) && !start.isAfter(periodEnd);
	}

	DatePeriod period() {
		return new DatePeriod(periodStart, periodEnd);
	}

	public UUID getId() {
		return id;
	}

	public Organization getOrganization() {
		return organization;
	}

	public String getName() {
		return name;
	}

	public LocalDate getPeriodStart() {
		return periodStart;
	}

	public LocalDate getPeriodEnd() {
		return periodEnd;
	}

	public String getPurpose() {
		return purpose;
	}

	public Integer getBaseYear() {
		return baseYear;
	}

	public ConsolidationApproach getConsolidationApproach() {
		return consolidationApproach;
	}

	public GwpSet getGwpSet() {
		return gwpSet;
	}

	public List<ActivityCategory> getScope3Categories() {
		if (scope3Categories == null || scope3Categories.isBlank()) {
			return List.of();
		}
		return Arrays.stream(scope3Categories.split(",")).map(String::trim).map(ActivityCategory::valueOf).toList();
	}

	public String getScope3ExclusionsRationale() {
		return scope3ExclusionsRationale;
	}

	/** A declared category not quantified this year, and why (spec 07.6). */
	public record NotQuantified(ActivityCategory category, String reason) {
	}

	public List<NotQuantified> getScope3NotQuantified() {
		if (scope3NotQuantified == null || scope3NotQuantified.isBlank()) {
			return List.of();
		}
		return scope3NotQuantified.lines().map(line -> {
			var split = line.indexOf('|');
			return new NotQuantified(ActivityCategory.valueOf(line.substring(0, split)), line.substring(split + 1));
		}).toList();
	}

	void setScope3NotQuantified(List<NotQuantified> entries) {
		this.scope3NotQuantified = entries.isEmpty() ? null
				: entries.stream()
					.map(entry -> entry.category().name() + "|" + entry.reason().replace('\n', ' '))
					.collect(Collectors.joining("\n"));
	}

	public Boolean getResidualMixAvailable() {
		return residualMixAvailable;
	}

	public BigDecimal getResidualMixKgCo2ePerKwh() {
		return residualMixKgCo2ePerKwh;
	}

	void setResidualMix(Boolean available, BigDecimal kgCo2ePerKwh) {
		this.residualMixAvailable = available;
		this.residualMixKgCo2ePerKwh = Boolean.TRUE.equals(available) ? kgCo2ePerKwh : null;
	}

	public UUID getFinalRunId() {
		return finalRunId;
	}

	public InventoryStatus getStatus() {
		return status;
	}

	public boolean isEditable() {
		return status.isEditable();
	}

	public UUID getSupersededById() {
		return supersededById;
	}

	public UUID getCopiedFromId() {
		return copiedFromId;
	}

	void setCopiedFromId(UUID copiedFromId) {
		this.copiedFromId = copiedFromId;
	}

	public String getCorrectionReason() {
		return correctionReason;
	}

	void setCorrectionReason(String correctionReason) {
		this.correctionReason = correctionReason;
	}

	public String getPublishedReport() {
		return publishedReport;
	}

	void setPublishedReport(String publishedReport) {
		this.publishedReport = publishedReport;
	}

	public String getInheritanceNotes() {
		return inheritanceNotes;
	}

	void setInheritanceNotes(String inheritanceNotes) {
		this.inheritanceNotes = inheritanceNotes;
	}

	public String getFinalDesignatedBy() {
		return finalDesignatedBy;
	}

	public Instant getFinalDesignatedAt() {
		return finalDesignatedAt;
	}

	public String getFinalNote() {
		return finalNote;
	}

	public UUID getFinalDesignatedByUserId() {
		return finalDesignatedByUserId;
	}

	public String getFinalDesignatedByName() {
		return finalDesignatedByName;
	}

	public boolean isFinalSelfApproved() {
		return finalSelfApproved;
	}

	/** The named preparer, or null (spec 05.8). */
	public Person getPreparer() {
		return preparerUserId == null && preparerEmail == null ? null
				: new Person(preparerUserId, preparerEmail, preparerName);
	}

	/** The named approver, or null (spec 05.8). */
	public Person getApprover() {
		return approverUserId == null && approverEmail == null ? null
				: new Person(approverUserId, approverEmail, approverName);
	}

	public UUID getSubmittedRunId() {
		return submittedRunId;
	}

	/** Who submitted the run in review, or the run signed off; null when nothing is submitted. */
	public Person getSubmittedBy() {
		return submittedByUserId == null && submittedBy == null ? null
				: new Person(submittedByUserId, submittedBy, submittedByName);
	}

	public Instant getSubmittedAt() {
		return submittedAt;
	}

	public String getSubmitNote() {
		return submitNote;
	}

	public Instant getPublishedAt() {
		return publishedAt;
	}

	public UUID getCurrentBoundaryVersionId() {
		return currentBoundaryVersionId;
	}

	public Integer getCurrentBoundaryVersionNo() {
		return currentBoundaryVersionNo;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	void update(String name, LocalDate periodStart, LocalDate periodEnd, String purpose, Integer baseYear,
			ConsolidationApproach consolidationApproach, GwpSet gwpSet) {
		this.name = name;
		this.periodStart = periodStart;
		this.periodEnd = periodEnd;
		this.purpose = purpose;
		this.baseYear = baseYear;
		this.consolidationApproach = consolidationApproach;
		this.gwpSet = gwpSet;
	}

	void setOperationalBoundary(List<ActivityCategory> scope3Categories, String exclusionsRationale) {
		this.scope3Categories = scope3Categories.isEmpty() ? null
				: scope3Categories.stream().distinct().map(Enum::name).collect(Collectors.joining(","));
		this.scope3ExclusionsRationale = exclusionsRationale;
	}

	/** Records a freshly cut version as the current one and freezes both halves of the view. */
	void freeze(BoundaryVersion version) {
		this.status = InventoryStatus.FROZEN;
		this.currentBoundaryVersionId = version.getId();
		this.currentBoundaryVersionNo = version.getVersionNo();
	}

	/** Reopens the inventory for editing; a submission goes with it. The latest version is kept for reference. */
	void reopen() {
		clearSubmission();
		this.status = InventoryStatus.DRAFT;
	}

	/** Puts a run forward for review (spec 05.8): who, when and the note travel with it to the report. */
	void submitForReview(UUID runId, Person submitter, String note) {
		this.submittedRunId = runId;
		this.submittedByUserId = submitter.userId();
		this.submittedBy = submitter.email();
		this.submittedByName = submitter.name();
		this.submittedAt = Instant.now();
		this.submitNote = note;
		this.status = InventoryStatus.IN_REVIEW;
	}

	/** A return, a new run or a void of the submitted run: frozen again, nothing submitted (spec 05.8). */
	void withdrawSubmission() {
		clearSubmission();
		this.status = InventoryStatus.FROZEN;
	}

	private void clearSubmission() {
		this.submittedRunId = null;
		this.submittedByUserId = null;
		this.submittedBy = null;
		this.submittedByName = null;
		this.submittedAt = null;
		this.submitNote = null;
	}

	/** Names the preparer and the approver, either or both; null clears (spec 05.8). */
	void assignSignOff(Person preparer, Person approver) {
		this.preparerUserId = preparer == null ? null : preparer.userId();
		this.preparerEmail = preparer == null ? null : preparer.email();
		this.preparerName = preparer == null ? null : preparer.name();
		this.approverUserId = approver == null ? null : approver.userId();
		this.approverEmail = approver == null ? null : approver.email();
		this.approverName = approver == null ? null : approver.name();
	}

	/**
	 * The sign-off (specs 05.5, 05.8): the submitted run becomes the final one, with who signed it, when,
	 * the review note, and whether it was a self-approval because nobody else could check it.
	 */
	void designateFinal(UUID runId, Person signer, String note, boolean selfApproved) {
		this.finalRunId = runId;
		this.finalDesignatedByUserId = signer.userId();
		this.finalDesignatedBy = signer.email();
		this.finalDesignatedByName = signer.name();
		this.finalDesignatedAt = Instant.now();
		this.finalNote = note;
		this.finalSelfApproved = selfApproved;
		this.status = InventoryStatus.FINAL;
	}

	/** Clears the sign-off and the submission together; the preparer resubmits (spec 05.8). */
	void withdrawFinal() {
		this.finalRunId = null;
		this.finalDesignatedByUserId = null;
		this.finalDesignatedBy = null;
		this.finalDesignatedByName = null;
		this.finalDesignatedAt = null;
		this.finalNote = null;
		this.finalSelfApproved = false;
		clearSubmission();
		this.status = InventoryStatus.FROZEN;
	}

	/** Whether the person is the named preparer, by account or by email. */
	boolean isPreparer(Person person) {
		return Person.same(preparerUserId, preparerEmail, person);
	}

	/** Whether the person is the named approver, by account or by email. */
	boolean isApprover(Person person) {
		return Person.same(approverUserId, approverEmail, person);
	}

	/** Whether the person submitted the run now in review or signed off, by account or by email. */
	boolean wasSubmittedBy(Person person) {
		return Person.same(submittedByUserId, submittedBy, person);
	}

	/**
	 * A member as an act records them (spec 05.8): the account, and the email and name as they were at
	 * the act, so a later profile change or removal does not rewrite who did it.
	 */
	public record Person(UUID userId, String email, String name) {

		/** Matches by account, or by email ignoring case where the account is not known. */
		static boolean same(UUID userId, String email, Person person) {
			if (person == null || userId == null && email == null) {
				return false;
			}
			if (userId != null && userId.equals(person.userId())) {
				return true;
			}
			return email != null && person.email() != null && email.equalsIgnoreCase(person.email());
		}
	}

	void publish(String publishedBy) {
		this.status = InventoryStatus.PUBLISHED;
		this.publishedAt = Instant.now();
		this.publishedBy = publishedBy;
	}

	void markSupersededBy(Inventory successor) {
		this.supersededById = successor.getId();
	}

	boolean covers(LocalDate date) {
		return !date.isBefore(periodStart) && !date.isAfter(periodEnd);
	}
}
