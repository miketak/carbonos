package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.carbonos.ghg.internal.GhgService;
import com.carbonos.ghg.internal.RelationshipType;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * A legal entity's Table 1 facts (spec 03.1, 03.3). Legal ownership is
 * optional, for disclosure only; {@code controlledByCompany} is recorded for
 * franchises only; {@code parentEntityId} names the entity the company holds
 * this one through.
 */
public record EntityRequest( //
		@NotBlank @Size(max = 120) String name, //
		@NotNull RelationshipType relationshipType, //
		@NotNull @DecimalMin("0") @DecimalMax("100") @Digits(integer = 3, fraction = 2) BigDecimal economicInterestPercent, //
		@DecimalMin("0") @DecimalMax("100") @Digits(integer = 3, fraction = 2) BigDecimal legalOwnershipPercent, //
		@NotNull Boolean operatedByCompany, //
		Boolean controlledByCompany, //
		UUID parentEntityId, //
		// spec 03.4: acquisition and disposal dates, jurisdiction, the financial-control decision
		LocalDate effectiveFrom, //
		LocalDate effectiveTo, //
		@Size(min = 2, max = 2) String jurisdiction, //
		Boolean financialControlOverride, //
		@Size(max = 500) String controlNote) {

	public GhgService.EntityFacts toFacts() {
		return new GhgService.EntityFacts(name, relationshipType, economicInterestPercent, legalOwnershipPercent,
				operatedByCompany, controlledByCompany, parentEntityId, effectiveFrom, effectiveTo, jurisdiction,
				financialControlOverride, controlNote);
	}
}
