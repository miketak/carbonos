package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.Dimension;
import com.carbonos.ghg.internal.EmissionFactor;
import com.carbonos.ghg.internal.GwpSet;
import com.carbonos.ghg.internal.Scope;

public record EmissionFactorResponse(UUID id, String name, Scope defaultScope, ActivityCategory defaultCategory,
		boolean scopeAgnostic, String unit, Dimension dimension, BigDecimal kgCo2ePerUnit, Gases gases,
		BigDecimal biogenicCo2KgPerUnit, GwpSet gwpSet, String source) {

	/** kg of each gas per unit; HFCs and PFCs are kg CO2e of the blend. */
	public record Gases(BigDecimal co2, BigDecimal ch4, BigDecimal n2o, BigDecimal hfcs, BigDecimal pfcs,
			BigDecimal sf6, BigDecimal nf3) {
	}

	public static EmissionFactorResponse from(EmissionFactor factor, Dimension dimension) {
		return new EmissionFactorResponse(factor.getId(), factor.getName(), factor.getDefaultScope(),
				factor.getDefaultCategory(), factor.isScopeAgnostic(), factor.getUnit(), dimension,
				factor.getKgCo2ePerUnit(),
				new Gases(factor.getCo2KgPerUnit(), factor.getCh4KgPerUnit(), factor.getN2oKgPerUnit(),
						factor.getHfcsKgCo2ePerUnit(), factor.getPfcsKgCo2ePerUnit(), factor.getSf6KgPerUnit(),
						factor.getNf3KgPerUnit()),
				factor.getBiogenicCo2KgPerUnit(), GwpSet.AR5, factor.getSource());
	}
}
