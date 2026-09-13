package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One organization's notice that a new edition of a pack it holds was published
 * (spec 02.7). Publishing raises it and changes nothing else: the organization's
 * factor values, its assignments and its run totals are the same the moment
 * after a publication as the moment before. Adopting an edition is an accounting
 * decision and belongs to the organization, not to the platform.
 *
 * <p>This phase of spec 02.5 raises notices. The inbox, the diff and the named
 * decision are spec 02.7's own phase; the columns that decision fills are
 * mapped here so the record stays one row rather than two.
 */
@Entity
@Table(name = "ghg_factor_pack_notices")
public class FactorPackNotice {

	public enum Status {

		/** Raised by a publication and not yet decided. */
		OPEN,

		/** The organization adopted the edition: the versioned import of spec 02.6 ran. */
		ACCEPTED,

		/** The organization declined: nothing changed. */
		DECLINED,

		/** The publisher withdrew the edition, so the decision fell away. */
		WITHDRAWN
	}

	/** How chapter 5 treats the adoption, which spec 02.7 requires an answer to. */
	public enum RecalculationCase {
		VINTAGE_PROGRESSION, RETROSPECTIVE_ADOPTION, ERRATUM_ON_REPORTED_YEAR
	}

	@Id
	private UUID id;

	@Column(name = "organization_id", nullable = false)
	private UUID organizationId;

	@Column(name = "edition_id", nullable = false, length = 60)
	private String editionId;

	@Column(name = "predecessor_edition_id", length = 60)
	private String predecessorEditionId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 12)
	private Status status;

	@Column(name = "raised_at", nullable = false)
	private Instant raisedAt;

	// the hash over the per-row comparison, so a verifier can confirm the diff the decider saw
	@Column(name = "diff_hash", nullable = false, length = 64)
	private String diffHash;

	@Column(name = "rows_affected", nullable = false)
	private int rowsAffected;

	@Column(name = "rows_over_threshold", nullable = false)
	private int rowsOverThreshold;

	@Column(name = "estimated_kg_co2e_delta", precision = 18, scale = 3)
	private BigDecimal estimatedKgCo2eDelta;

	@Column(name = "decided_at")
	private Instant decidedAt;

	@Column(name = "decided_by_user_id")
	private UUID decidedByUserId;

	@Column(name = "decided_by", length = 320)
	private String decidedBy;

	@Enumerated(EnumType.STRING)
	@Column(name = "decided_by_role", length = 20)
	private OrgRole decidedByRole;

	@Column(name = "decision_note", length = 2000)
	private String decisionNote;

	@Enumerated(EnumType.STRING)
	@Column(name = "recalculation_case", length = 30)
	private RecalculationCase recalculationCase;

	@Column(name = "recalculation_id")
	private UUID recalculationId;

	@Column(name = "applied_at")
	private Instant appliedAt;

	@Column(name = "significance_threshold_percent", precision = 6, scale = 2)
	private BigDecimal significanceThresholdPercent;

	@Column(name = "affected_percent", precision = 9, scale = 4)
	private BigDecimal affectedPercent;

	@Column(name = "scopes_affected", length = 40)
	private String scopesAffected;

	protected FactorPackNotice() {
	}

	/** What publication raises: an open notice naming the movement the organization would see. */
	FactorPackNotice(UUID organizationId, String editionId, String predecessorEditionId, String diffHash,
			int rowsAffected, int rowsOverThreshold, BigDecimal estimatedKgCo2eDelta, String scopesAffected) {
		this.id = UUID.randomUUID();
		this.organizationId = organizationId;
		this.editionId = editionId;
		this.predecessorEditionId = predecessorEditionId;
		this.status = Status.OPEN;
		this.raisedAt = Instant.now();
		this.diffHash = diffHash;
		this.rowsAffected = rowsAffected;
		this.rowsOverThreshold = rowsOverThreshold;
		this.estimatedKgCo2eDelta = estimatedKgCo2eDelta;
		this.scopesAffected = scopesAffected;
	}

	/** Withdrawing an edition closes every open notice for it; the organization never has to answer. */
	void closeAsWithdrawn() {
		if (status == Status.OPEN) {
			this.status = Status.WITHDRAWN;
		}
	}

	public UUID getId() {
		return id;
	}

	public UUID getOrganizationId() {
		return organizationId;
	}

	public String getEditionId() {
		return editionId;
	}

	public String getPredecessorEditionId() {
		return predecessorEditionId;
	}

	public Status getStatus() {
		return status;
	}

	public Instant getRaisedAt() {
		return raisedAt;
	}

	public String getDiffHash() {
		return diffHash;
	}

	public int getRowsAffected() {
		return rowsAffected;
	}

	public int getRowsOverThreshold() {
		return rowsOverThreshold;
	}

	public BigDecimal getEstimatedKgCo2eDelta() {
		return estimatedKgCo2eDelta;
	}

	public Instant getDecidedAt() {
		return decidedAt;
	}

	public UUID getDecidedByUserId() {
		return decidedByUserId;
	}

	public String getDecidedBy() {
		return decidedBy;
	}

	public OrgRole getDecidedByRole() {
		return decidedByRole;
	}

	public String getDecisionNote() {
		return decisionNote;
	}

	public RecalculationCase getRecalculationCase() {
		return recalculationCase;
	}

	public UUID getRecalculationId() {
		return recalculationId;
	}

	public Instant getAppliedAt() {
		return appliedAt;
	}

	public BigDecimal getSignificanceThresholdPercent() {
		return significanceThresholdPercent;
	}

	public BigDecimal getAffectedPercent() {
		return affectedPercent;
	}

	public String getScopesAffected() {
		return scopesAffected;
	}
}
