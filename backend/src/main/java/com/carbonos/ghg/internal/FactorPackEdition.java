package com.carbonos.ghg.internal;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One dated release of a factor pack family (spec 02.5): {@code defra-2026},
 * {@code defra-2026.r2}. The edition, not the family, is the unit of vintage, so
 * a citation names one thing forever. It carries the publication it represents,
 * the date it applies from, and, once published, the evidence checksum and the
 * two people behind it.
 *
 * <p>The ten editions {@code V43} seeded read {@code SEED_UNCHECKED}: their
 * values were in production before the catalogue existed, so their checksum is
 * over the shipped JSON rather than the publication and no approver checked
 * them. An edition authored in the console can never carry that value, and the
 * publication gate of the console phase enforces the rest.
 */
@Entity
@Table(name = "ghg_factor_pack_editions")
public class FactorPackEdition {

	/** The provenance of the ten editions the seed created, which alone may publish without an approver. */
	public static final String SEED_UNCHECKED = "SEED_UNCHECKED";

	@Id
	@Column(name = "edition_id", length = 60)
	private String editionId;

	@Column(name = "pack_key", nullable = false, length = 60)
	private String packKey;

	@Column(nullable = false, length = 200)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 12)
	private FactorPackStatus status;

	@Column(nullable = false, length = 500)
	private String source;

	@Column(name = "source_url", length = 500)
	private String sourceUrl;

	@Column(name = "publication_year")
	private Integer publicationYear;

	@Column(name = "gwp_basis", length = 20)
	private String gwpBasis;

	@Column(length = 200)
	private String license;

	// the date the tables were retrieved, as the publication states it
	@Column(length = 20)
	private String retrieved;

	@Column(length = 4000)
	private String notes;

	@Column(name = "applies_from")
	private LocalDate appliesFrom;

	@Column(name = "published_at")
	private Instant publishedAt;

	@Column(name = "source_document", length = 500)
	private String sourceDocument;

	@Column(name = "evidence_checksum", length = 64)
	private String evidenceChecksum;

	@Column(name = "curator_user_id")
	private UUID curatorUserId;

	@Column(name = "curator_name", length = 200)
	private String curatorName;

	@Column(name = "approver_user_id")
	private UUID approverUserId;

	@Column(name = "approver_name", length = 200)
	private String approverName;

	@Column(name = "provenance_review", nullable = false, length = 20)
	private String provenanceReview;

	@Column(name = "provenance_note", length = 1000)
	private String provenanceNote;

	protected FactorPackEdition() {
	}

	public String getEditionId() {
		return editionId;
	}

	public String getPackKey() {
		return packKey;
	}

	public String getName() {
		return name;
	}

	public FactorPackStatus getStatus() {
		return status;
	}

	public String getSource() {
		return source;
	}

	public String getSourceUrl() {
		return sourceUrl;
	}

	public Integer getPublicationYear() {
		return publicationYear;
	}

	public String getGwpBasis() {
		return gwpBasis;
	}

	public String getLicense() {
		return license;
	}

	public String getRetrieved() {
		return retrieved;
	}

	public String getNotes() {
		return notes;
	}

	public LocalDate getAppliesFrom() {
		return appliesFrom;
	}

	public Instant getPublishedAt() {
		return publishedAt;
	}

	public String getSourceDocument() {
		return sourceDocument;
	}

	public String getEvidenceChecksum() {
		return evidenceChecksum;
	}

	public UUID getCuratorUserId() {
		return curatorUserId;
	}

	public String getCuratorName() {
		return curatorName;
	}

	public UUID getApproverUserId() {
		return approverUserId;
	}

	public String getApproverName() {
		return approverName;
	}

	/** {@code REVIEWED}, or {@code SEED_UNCHECKED} for one of the ten the seed created. */
	public String getProvenanceReview() {
		return provenanceReview;
	}

	public String getProvenanceNote() {
		return provenanceNote;
	}
}
