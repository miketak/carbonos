package com.carbonos.ghg.internal;

/**
 * Whether a factor's emissions belong in the scopes at all (spec 02.4).
 *
 * <p>Chapter 4 counts the seven Kyoto gas groups. A Montreal Protocol gas
 * (HCFC-22, the CFCs, the halons) is not one of them: its mass is disclosed
 * separately, with the CO2e its source publishes for information, and it
 * never enters a scope total, a by-scope table, the by-gas table or an
 * intensity figure.
 */
public enum ReportingBasis {

	/** Counted in the scopes, like every Kyoto gas. */
	SCOPES,

	/** A non-Kyoto gas: reported separately as optional information, outside every scope. */
	OUTSIDE_SCOPES_NON_KYOTO;

	/** Whether a line calculated with this basis counts towards the scope totals. */
	public boolean inScopes() {
		return this == SCOPES;
	}
}
