package com.carbonos.ghg.internal;

/**
 * A physical quantity that a unit measures. Two units can be converted into
 * one another only when they share a dimension; cross-dimension conversions
 * (e.g. gas volume to energy) are substance-specific and out of scope.
 */
public enum Dimension {

	ENERGY, VOLUME, MASS, DISTANCE, PASSENGER_DISTANCE

}
