package com.carbonos.ghg.internal;

/**
 * What a run's market-based scope 2 figure rests on (spec 07.3): contractual
 * instruments applied to the kWh they cover, the residual mix for every kWh
 * when no instrument was applied, or the grid average (the location-based
 * factor standing in) when no residual mix is available either.
 */
public enum Scope2MarketBasis {
	INSTRUMENTS, RESIDUAL_MIX, GRID_AVERAGE
}
