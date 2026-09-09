package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.carbonos.ghg.internal.InventoryService;
import com.carbonos.ghg.internal.RelationshipType;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

/**
 * Every field is optional (spec 03): when the treatment is being created, an
 * absent field is prefilled from the entity's facts, so {@code {}} adds an
 * entity or facility exactly as its record describes it; when it already
 * exists, an absent field keeps its current value. The membership window
 * (spec 03.2) is cleared with {@code clearWindow}.
 */
public record BoundaryTreatmentRequest( //
		RelationshipType relationshipType, //
		@DecimalMin("0.00") @DecimalMax("100.00") BigDecimal economicInterestPercent, //
		Boolean operatedByCompany, //
		Boolean controlledByCompany, //
		LocalDate effectiveFrom, //
		LocalDate effectiveTo, //
		Boolean clearWindow) {

	public InventoryService.TreatmentInput toInput() {
		return new InventoryService.TreatmentInput(relationshipType, economicInterestPercent, operatedByCompany,
				controlledByCompany, effectiveFrom, effectiveTo, Boolean.TRUE.equals(clearWindow));
	}
}
