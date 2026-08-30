package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;

import com.carbonos.ghg.internal.Dimension;
import com.carbonos.ghg.internal.UnitConverter.UnitDef;

/**
 * A convertible unit for the activity-entry picker and the client-side
 * conversion preview. {@code toCanonical} is the unit's size in its dimension's
 * base unit, so the client can preview a conversion the same way the backend
 * computes it at run time.
 */
public record UnitResponse(String code, String label, Dimension dimension, BigDecimal toCanonical) {

	public static UnitResponse from(UnitDef def) {
		return new UnitResponse(def.code(), def.label(), def.dimension(), def.toCanonical());
	}
}
