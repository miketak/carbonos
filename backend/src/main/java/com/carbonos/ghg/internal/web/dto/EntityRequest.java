package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;

import com.carbonos.ghg.internal.RelationshipType;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** A legal entity's Table 1 facts (spec 03.1). Legal ownership is optional, for disclosure only. */
public record EntityRequest( //
		@NotBlank @Size(max = 120) String name, //
		@NotNull RelationshipType relationshipType, //
		@NotNull @DecimalMin("0") @DecimalMax("100") @Digits(integer = 3, fraction = 2) BigDecimal economicInterestPercent, //
		@DecimalMin("0") @DecimalMax("100") @Digits(integer = 3, fraction = 2) BigDecimal legalOwnershipPercent, //
		@NotNull Boolean operatedByCompany) {
}
