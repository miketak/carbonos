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
	 * How long a support-access grant lasts from the moment it is taken
	 * (spec 01.3, decision D-02). Between 1 and 72 hours; 24 by default.
	 * A grant stores its own expiry, so changing this never moves a grant
	 * already in force.
	 */
	Duration supportAccessWindow();

	/** Who may create a reporting organization. */
	OrganizationCreation organizationCreation();
}
