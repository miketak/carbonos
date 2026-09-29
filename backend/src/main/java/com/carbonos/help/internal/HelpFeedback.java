package com.carbonos.help.internal;

import java.time.Instant;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One voter's answer to "Was this helpful?" on one article (spec 09). The
 * voter hash keeps the vote unique per voter and article; it identifies
 * nobody and leaves the module through no endpoint. Rows are written by the
 * repository's upsert, so the entity is read-only here.
 */
@Entity
@Table(name = "help_feedback")
public class HelpFeedback {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "page_slug", nullable = false, length = 160)
	private String pageSlug;

	@Column(nullable = false)
	private boolean helpful;

	@Enumerated(EnumType.STRING)
	@Column(length = 20)
	private HelpFeedbackReason reason;

	@Column(length = 500)
	private String comment;

	@JdbcTypeCode(SqlTypes.CHAR)
	@Column(name = "voter_hash", nullable = false, length = 64)
	private String voterHash;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected HelpFeedback() {
	}

	public Long getId() {
		return id;
	}

	public String getPageSlug() {
		return pageSlug;
	}

	public boolean isHelpful() {
		return helpful;
	}

	public HelpFeedbackReason getReason() {
		return reason;
	}

	public String getComment() {
		return comment;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
