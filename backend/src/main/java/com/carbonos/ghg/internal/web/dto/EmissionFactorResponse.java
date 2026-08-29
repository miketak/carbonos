package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.EmissionFactor;
import com.carbonos.ghg.internal.Scope;

public record EmissionFactorResponse(UUID id, String name, Scope scope, ActivityCategory category, String unit,
		BigDecimal kgCo2ePerUnit, String source) {

	public static EmissionFactorResponse from(EmissionFactor factor) {
		return new EmissionFactorResponse(factor.getId(), factor.getName(), factor.getScope(), factor.getCategory(),
				factor.getUnit(), factor.getKgCo2ePerUnit(), factor.getSource());
	}
}
