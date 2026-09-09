package com.carbonos.ghg.internal;

/**
 * A member's role in an organization (spec 01.2). OWNER manages members and
 * the organization; REVIEWER approves (final, publish, correction); PREPARER
 * records, classifies and runs; VERIFIER reads only.
 */
public enum OrgRole {
	OWNER, REVIEWER, PREPARER, VERIFIER;

	/** Whether the role may change data at all. */
	public boolean canWrite() {
		return this != VERIFIER;
	}

	/** Whether the role may designate a final run, publish and create a correction. */
	public boolean canApprove() {
		return this == OWNER || this == REVIEWER;
	}

	public boolean isOwner() {
		return this == OWNER;
	}
}
