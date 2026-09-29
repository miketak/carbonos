package com.carbonos.help.internal;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One day's search counts (spec 09): every search, and the ones that found
 * nothing, so the miss rate has a denominator. Days are UTC. Rows are
 * written by the repository's upsert, so the entity is read-only here.
 */
@Entity
@Table(name = "help_search_days")
public class HelpSearchDay {

	@Id
	@Column(name = "day")
	private LocalDate day;

	@Column(nullable = false)
	private int searches;

	@Column(nullable = false)
	private int misses;

	protected HelpSearchDay() {
	}

	public LocalDate getDay() {
		return day;
	}

	public int getSearches() {
		return searches;
	}

	public int getMisses() {
		return misses;
	}
}
