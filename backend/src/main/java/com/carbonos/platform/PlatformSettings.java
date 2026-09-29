package com.carbonos.platform;

import java.time.Duration;

/**
 * The deployment's policy, as the modules that obey it read it (spec 01.5).
 * Writing it is the administration panel's business, through this module's
 * own endpoints; other modules only read.
 */
public interface PlatformSettings {

	/** Who may create a reporting organization on this deployment (decision D-03). */
	enum OrganizationCreation {

		/** Any signed-in user, which is how CarbonOS has always behaved. */
		EVERYONE,

		/** A platform administrator only, naming the account that becomes the owner. */
		ADMINISTRATORS
	}

	/**
	 * Whether a factor pack edition whose applies-from date falls inside a
	 * PUBLISHED period may be imported or accepted (spec 02.6 rule 1, amended
	 * 2026-09-29). FROZEN and FINAL periods block under both values.
	 */
	enum EditionsInPublishedPeriods {

		/** A published period blocks, as it always has. The default. */
		BLOCKED,

		/**
		 * A published period, superseded or not, no longer blocks. Its runs keep
		 * the factors they reported with, because a run stores the values it
		 * applied and a published report is stored as it read at publication.
		 */
		ALLOWED
	}

	/**
	 * How long a support-access grant lasts from the moment it is taken
	 * (spec 01.3, decision D-02). Between 1 and 72 hours; 24 by default.
	 * A grant stores its own expiry, so changing this never moves a grant
	 * already in force.
	 */
	Duration supportAccessWindow();

	/** Who may create a reporting organization. */
	OrganizationCreation organizationCreation();

	/** Whether a published period blocks an edition that applies inside it. */
	EditionsInPublishedPeriods editionsInPublishedPeriods();
}
