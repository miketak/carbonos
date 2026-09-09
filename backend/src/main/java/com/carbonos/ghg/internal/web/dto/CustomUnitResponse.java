package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

import com.carbonos.ghg.internal.CustomUnit;

public record CustomUnitResponse(UUID id, String code, String label, String baseUnit, BigDecimal factor,
		String definition) {

	public static CustomUnitResponse from(CustomUnit unit) {
		return new CustomUnitResponse(unit.getId(), unit.getCode(), unit.getLabel(), unit.getBaseUnit(),
				unit.getFactor(), unit.definition());
	}
}
