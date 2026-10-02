package com.carbonos.user;

/**
 * The deployment's initial administrator, seeded from
 * {@code CARBONOS_ADMIN_EMAIL} and {@code CARBONOS_ADMIN_PASSWORD} at startup.
 * Public so the {@code qa} module can seed it again after a reset.
 */
public interface InitialAdmin {

	/** Creates the configured administrator when it is configured and absent; otherwise does nothing. */
	void seed();
}
