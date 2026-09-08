package com.carbonos.ghg.internal;

/**
 * Appendix F of the Corporate Standard (spec 04.1): the scope of a leased
 * asset's emissions depends on the lease type and the consolidation approach.
 */
public enum LeaseType {
	FINANCE_LEASE_IN, OPERATING_LEASE_IN, FINANCE_LEASE_OUT, OPERATING_LEASE_OUT;

	/** A scope and category derived for a leased asset. */
	record Derived(Scope scope, ActivityCategory category) {
	}

	/**
	 * Under operational control, assets the company leases in and operates are
	 * scope 1 or 2 whatever the lease type; under equity share or financial
	 * control, finance leases are scope 1 or 2 and operating leases are scope 3
	 * (upstream leased assets). Assets leased out mirror this downstream.
	 */
	Derived derive(ConsolidationApproach approach, Scope inherentScope, ActivityCategory inherentCategory) {
		var controlApproach = approach == ConsolidationApproach.OPERATIONAL_CONTROL;
		return switch (this) {
			case FINANCE_LEASE_IN -> new Derived(inherentScope, inherentCategory);
			case OPERATING_LEASE_IN -> controlApproach ? new Derived(inherentScope, inherentCategory)
					: new Derived(Scope.SCOPE_3, ActivityCategory.UPSTREAM_LEASED_ASSETS);
			case FINANCE_LEASE_OUT -> new Derived(Scope.SCOPE_3, ActivityCategory.DOWNSTREAM_LEASED_ASSETS);
			case OPERATING_LEASE_OUT -> controlApproach
					? new Derived(Scope.SCOPE_3, ActivityCategory.DOWNSTREAM_LEASED_ASSETS)
					: new Derived(inherentScope, inherentCategory);
		};
	}
}
