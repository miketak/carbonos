package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;

import com.carbonos.ghg.internal.FactorPackChange;

/**
 * One line of the change log an edition froze at publication (spec 02.5),
 * computed against the predecessor edition of the same family.
 */
public record FactorPackChangeResponse(String code, FactorPackChange.Kind kind, BigDecimal oldKgCo2e,
		BigDecimal newKgCo2e, BigDecimal percentChange, String fields) {

	public static FactorPackChangeResponse from(FactorPackChange change) {
		return new FactorPackChangeResponse(change.getCode(), change.getKind(), change.getOldKgCo2e(),
				change.getNewKgCo2e(), change.getPercentChange(), change.getFields());
	}
}
