package com.carbonos.ghg.internal;

/**
 * Emission source categories (spec 04.1): the Standard's scope 1 kinds, the
 * two scope 2 kinds, and the Scope 3 Standard's fifteen categories. Each
 * category belongs to exactly one scope; the accountant chooses both.
 */
public enum ActivityCategory {
	// scope 1
	STATIONARY_COMBUSTION(Scope.SCOPE_1), MOBILE_COMBUSTION(Scope.SCOPE_1), PROCESS_EMISSIONS(Scope.SCOPE_1),
	FUGITIVE_EMISSIONS(Scope.SCOPE_1),
	// scope 2
	PURCHASED_ELECTRICITY(Scope.SCOPE_2), PURCHASED_HEAT_STEAM(Scope.SCOPE_2),
	// scope 3, upstream (categories 1 to 8)
	PURCHASED_GOODS_SERVICES(Scope.SCOPE_3), CAPITAL_GOODS(Scope.SCOPE_3), FUEL_ENERGY_RELATED(Scope.SCOPE_3),
	UPSTREAM_TRANSPORT(Scope.SCOPE_3), WASTE_GENERATED(Scope.SCOPE_3), BUSINESS_TRAVEL(Scope.SCOPE_3),
	EMPLOYEE_COMMUTING(Scope.SCOPE_3), UPSTREAM_LEASED_ASSETS(Scope.SCOPE_3),
	// scope 3, downstream (categories 9 to 15)
	DOWNSTREAM_TRANSPORT(Scope.SCOPE_3), PROCESSING_SOLD_PRODUCTS(Scope.SCOPE_3), USE_SOLD_PRODUCTS(Scope.SCOPE_3),
	END_OF_LIFE_SOLD_PRODUCTS(Scope.SCOPE_3), DOWNSTREAM_LEASED_ASSETS(Scope.SCOPE_3), FRANCHISES(Scope.SCOPE_3),
	INVESTMENTS(Scope.SCOPE_3),
	// a pre-existing seeded category, kept for the water-supply factor (purchased goods in the Scope 3 Standard)
	WATER_SUPPLY(Scope.SCOPE_3);

	private final Scope scope;

	ActivityCategory(Scope scope) {
		this.scope = scope;
	}

	public Scope scope() {
		return scope;
	}
}
