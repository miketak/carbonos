package com.carbonos.ghg.internal;

import java.util.List;

/**
 * The kind of a source stream (spec 04.3): what a facility burns, buys,
 * discards or moves. The kind fixes the categories a record of the stream
 * may be classified into; the stream's ownership fixes the default scope.
 */
public enum StreamKind {
	STATIONARY_COMBUSTION(List.of(ActivityCategory.STATIONARY_COMBUSTION, ActivityCategory.PURCHASED_GOODS_SERVICES,
			ActivityCategory.UPSTREAM_LEASED_ASSETS, ActivityCategory.DOWNSTREAM_LEASED_ASSETS,
			ActivityCategory.FUEL_ENERGY_RELATED)),
	MOBILE_COMBUSTION(List.of(ActivityCategory.MOBILE_COMBUSTION, ActivityCategory.PURCHASED_GOODS_SERVICES,
			ActivityCategory.UPSTREAM_TRANSPORT, ActivityCategory.DOWNSTREAM_TRANSPORT,
			ActivityCategory.UPSTREAM_LEASED_ASSETS, ActivityCategory.FUEL_ENERGY_RELATED)),
	PROCESS(List.of(ActivityCategory.PROCESS_EMISSIONS, ActivityCategory.PURCHASED_GOODS_SERVICES,
			ActivityCategory.PROCESSING_SOLD_PRODUCTS)),
	FUGITIVE(List.of(ActivityCategory.FUGITIVE_EMISSIONS, ActivityCategory.PURCHASED_GOODS_SERVICES,
			ActivityCategory.UPSTREAM_LEASED_ASSETS, ActivityCategory.DOWNSTREAM_LEASED_ASSETS)),
	PURCHASED_ELECTRICITY(List.of(ActivityCategory.PURCHASED_ELECTRICITY, ActivityCategory.FUEL_ENERGY_RELATED,
			ActivityCategory.UPSTREAM_LEASED_ASSETS, ActivityCategory.DOWNSTREAM_LEASED_ASSETS,
			ActivityCategory.PURCHASED_GOODS_SERVICES)),
	PURCHASED_HEAT_STEAM_COOLING(List.of(ActivityCategory.PURCHASED_HEAT_STEAM, ActivityCategory.PURCHASED_COOLING,
			ActivityCategory.FUEL_ENERGY_RELATED, ActivityCategory.UPSTREAM_LEASED_ASSETS)),
	WASTE(List.of(ActivityCategory.WASTE_GENERATED, ActivityCategory.FUGITIVE_EMISSIONS,
			ActivityCategory.END_OF_LIFE_SOLD_PRODUCTS)),
	TRANSPORT(List.of(ActivityCategory.UPSTREAM_TRANSPORT, ActivityCategory.DOWNSTREAM_TRANSPORT,
			ActivityCategory.MOBILE_COMBUSTION)),
	TRAVEL(List.of(ActivityCategory.BUSINESS_TRAVEL)),
	COMMUTING(List.of(ActivityCategory.EMPLOYEE_COMMUTING)),
	PURCHASED_GOODS(List.of(ActivityCategory.PURCHASED_GOODS_SERVICES, ActivityCategory.CAPITAL_GOODS)),
	OTHER(List.of(ActivityCategory.values()));

	private final List<ActivityCategory> categories;

	StreamKind(List<ActivityCategory> categories) {
		this.categories = categories;
	}

	/** The categories a record of this kind may be classified into. */
	public List<ActivityCategory> categories() {
		return categories;
	}

	/** The default category: the company's own source, or a contractor's (Chapter 4, Scope 3 Standard). */
	public ActivityCategory defaultCategory(boolean contractorOperated) {
		if (!contractorOperated) {
			return categories.getFirst();
		}
		return switch (this) {
			case TRANSPORT, MOBILE_COMBUSTION -> ActivityCategory.UPSTREAM_TRANSPORT;
			case TRAVEL -> ActivityCategory.BUSINESS_TRAVEL;
			case COMMUTING -> ActivityCategory.EMPLOYEE_COMMUTING;
			case WASTE -> ActivityCategory.WASTE_GENERATED;
			case PURCHASED_GOODS -> ActivityCategory.PURCHASED_GOODS_SERVICES;
			default -> ActivityCategory.PURCHASED_GOODS_SERVICES;
		};
	}
}
