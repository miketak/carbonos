package com.carbonos.ghg.internal;

/**
 * Where an edition of a factor pack stands (spec 02.5). Only a draft is
 * mutable: once published, an edition's rows, metadata and values never change,
 * because reports already rest on them.
 */
public enum FactorPackStatus {

	/** Invisible to organizations, rows mutable. */
	DRAFT,

	/** Importable, rows frozen. */
	PUBLISHED,

	/** A successor was published: readable, not importable. */
	SUPERSEDED,

	/** Withdrawn with a reason: readable, not importable. */
	WITHDRAWN;

	/** Whether an organization may see this edition at all; a draft is the platform's business. */
	public boolean visibleToOrganizations() {
		return this != DRAFT;
	}
}
