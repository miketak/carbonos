package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.Dimension;
import com.carbonos.ghg.internal.EmissionFactor;
import com.carbonos.ghg.internal.GwpSet;
import com.carbonos.ghg.internal.Scope;

public record EmissionFactorResponse(UUID id, UUID organizationId, String name, Scope defaultScope,
		ActivityCategory defaultCategory, boolean scopeAgnostic, String unit, Dimension dimension,
		BigDecimal kgCo2ePerUnit, Gases gases, BigDecimal biogenicCo2KgPerUnit, GwpSet gwpSet, String blendGwpSource,
		String blendComposition, boolean ch4Fossil, boolean co2eOnly, String source, String sourceUrl,
		Integer publicationYear, Integer dataYear, LocalDate validFrom, LocalDate validTo, String note,
		boolean approved, String pack, String packCode, String gridRegion) {

	/** kg of each gas per unit; for the HFC and PFC blends also the kg CO2e the source applied (spec 07.2). */
	public record Gases(BigDecimal co2, BigDecimal ch4, BigDecimal n2o, BigDecimal hfcs, BigDecimal pfcs,
			BigDecimal sf6, BigDecimal nf3, BigDecimal hfcsKg, BigDecimal pfcsKg) {
	}

	public static EmissionFactorResponse from(EmissionFactor factor, Dimension dimension) {
		return new EmissionFactorResponse(factor.getId(), factor.getOrganizationId(), factor.getName(),
				factor.getDefaultScope(), factor.getDefaultCategory(), factor.isScopeAgnostic(), factor.getUnit(),
				dimension, factor.getKgCo2ePerUnit(),
				new Gases(factor.getCo2KgPerUnit(), factor.getCh4KgPerUnit(), factor.getN2oKgPerUnit(),
						factor.getHfcsKgCo2ePerUnit(), factor.getPfcsKgCo2ePerUnit(), factor.getSf6KgPerUnit(),
						factor.getNf3KgPerUnit(), factor.getHfcsKgPerUnit(), factor.getPfcsKgPerUnit()),
				factor.getBiogenicCo2KgPerUnit(), GwpSet.AR5, factor.getBlendGwpSource(), factor.describeBlend(),
				factor.isCh4Fossil(), factor.isCo2eOnly(), factor.getSource(), factor.getSourceUrl(),
				factor.getPublicationYear(), factor.getDataYear(), factor.getValidFrom(), factor.getValidTo(),
				factor.getNote(), factor.isApproved(), factor.getPack(), factor.getPackCode(), factor.getGridRegion());
	}
}
