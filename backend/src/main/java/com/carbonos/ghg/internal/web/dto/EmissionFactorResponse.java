package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.Dimension;
import com.carbonos.ghg.internal.EmissionFactor;
import com.carbonos.ghg.internal.GwpSet;
import com.carbonos.ghg.internal.ReportingBasis;
import com.carbonos.ghg.internal.Scope;

public record EmissionFactorResponse(UUID id, UUID organizationId, String name, Scope defaultScope,
		ActivityCategory defaultCategory, boolean scopeAgnostic, String unit, Dimension dimension,
		BigDecimal kgCo2ePerUnit, Gases gases, BigDecimal biogenicCo2KgPerUnit, GwpSet gwpSet, String blendGwpSource,
		String blendComposition, boolean ch4Fossil, boolean co2eOnly, String source, String sourceUrl,
		Integer publicationYear, Integer dataYear, LocalDate validFrom, LocalDate validTo, String note,
		boolean approved, String pack, List<String> packs, String packCode, String gridRegion,
		ReportingBasis reportingBasis, String sourceCategory, String sourceActivity, String sourceDetail,
		String sourceEdition, boolean locallyEdited, UUID supersededById, List<Version> versions) {

	/** kg of each gas per unit; for the HFC and PFC blends also the kg CO2e the source applied (spec 07.2). */
	public record Gases(BigDecimal co2, BigDecimal ch4, BigDecimal n2o, BigDecimal hfcs, BigDecimal pfcs,
			BigDecimal sf6, BigDecimal nf3, BigDecimal hfcsKg, BigDecimal pfcsKg) {
	}

	/**
	 * One version of the lineage this factor belongs to (spec 02.6): the
	 * edition it came from, the window it applies to, and its value, so a
	 * preparer can see which vintage covers a reporting period. Empty unless the
	 * lineage holds more than one version.
	 */
	public record Version(UUID id, String sourceEdition, LocalDate validFrom, LocalDate validTo,
			BigDecimal kgCo2ePerUnit, boolean live, boolean locallyEdited) {

		static Version of(EmissionFactor factor) {
			return new Version(factor.getId(), factor.getSourceEdition(), factor.getValidFrom(), factor.getValidTo(),
					factor.getKgCo2ePerUnit(), factor.isLive(), factor.isLocallyEdited());
		}
	}

	public static EmissionFactorResponse from(EmissionFactor factor, Dimension dimension) {
		return from(factor, dimension, List.of());
	}

	/** The factor with the other versions of its lineage, which the page shows as a chain (spec 02.6). */
	public static EmissionFactorResponse from(EmissionFactor factor, Dimension dimension,
			List<EmissionFactor> versions) {
		return new EmissionFactorResponse(factor.getId(), factor.getOrganizationId(), factor.getName(),
				factor.getDefaultScope(), factor.getDefaultCategory(), factor.isScopeAgnostic(), factor.getUnit(),
				dimension, factor.getKgCo2ePerUnit(),
				new Gases(factor.getCo2KgPerUnit(), factor.getCh4KgPerUnit(), factor.getN2oKgPerUnit(),
						factor.getHfcsKgCo2ePerUnit(), factor.getPfcsKgCo2ePerUnit(), factor.getSf6KgPerUnit(),
						factor.getNf3KgPerUnit(), factor.getHfcsKgPerUnit(), factor.getPfcsKgPerUnit()),
				factor.getBiogenicCo2KgPerUnit(), GwpSet.AR5, factor.getBlendGwpSource(), factor.describeBlend(),
				factor.isCh4Fossil(), factor.isCo2eOnly(), factor.getSource(), factor.getSourceUrl(),
				factor.getPublicationYear(), factor.getDataYear(), factor.getValidFrom(), factor.getValidTo(),
				factor.getNote(), factor.isApproved(), factor.getPack(), factor.getPacks(), factor.getPackCode(),
				factor.getGridRegion(), factor.getReportingBasis(), factor.getSourceCategory(),
				factor.getSourceActivity(), factor.getSourceDetail(), factor.getSourceEdition(),
				factor.isLocallyEdited(), factor.getSupersededById(), versions.stream().map(Version::of).toList());
	}
}
