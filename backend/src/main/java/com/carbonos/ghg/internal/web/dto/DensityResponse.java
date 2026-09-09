package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

import com.carbonos.ghg.internal.Density;

/** A density; {@code typical} marks a shared planning value rather than a supplier's figure (spec 02.2). */
public record DensityResponse(UUID id, UUID organizationId, boolean typical, String material, BigDecimal kgPerLitre,
		String source, String note) {

	public static DensityResponse from(Density density) {
		return new DensityResponse(density.getId(), density.getOrganizationId(), density.isTypical(),
				density.getMaterial(), density.getKgPerLitre(), density.getSource(), density.getNote());
	}
}
