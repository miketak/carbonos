package com.carbonos.help.internal;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A search that found nothing, kept as its normalized text and how often it
 * happened (spec 09). Successful searches are never stored. Rows are written
 * by the repository's upsert, so the entity is read-only here.
 */
@Entity
@Table(name = "help_search_misses")
public class HelpSearchMiss {

	@Id
	@Column(name = "query_normalized", length = 120)
	private String queryNormalized;

	@Column(name = "count", nullable = false)
	private int count;

	@Column(name = "first_seen", nullable = false)
	private Instant firstSeen;

	@Column(name = "last_seen", nullable = false)
	private Instant lastSeen;

	protected HelpSearchMiss() {
	}

	public String getQueryNormalized() {
		return queryNormalized;
	}

	public int getCount() {
		return count;
	}

	public Instant getFirstSeen() {
		return firstSeen;
	}

	public Instant getLastSeen() {
		return lastSeen;
	}
}
