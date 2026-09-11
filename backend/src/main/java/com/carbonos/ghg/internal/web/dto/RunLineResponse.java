package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.DataQuality;
import com.carbonos.ghg.internal.GhgRunLine;
import com.carbonos.ghg.internal.LeaseType;
import com.carbonos.ghg.internal.MarketInstrument;
import com.carbonos.ghg.internal.Scope;
import com.carbonos.ghg.internal.Scope2MarketBasis;

public record RunLineResponse(UUID id, UUID activityId, String recordRef, UUID facilityId, String facilityName, UUID entityId,
		String entityName, String country, String activityType, String evidenceRef, UUID factorId, String factorName,
		String streamName, String scopeJustification, boolean proxy, String proxyJustification,
		DataQuality dataQuality, Integer dataQualityTier, BigDecimal uncertaintyPercent, String evidenceFiles,
		String densityMaterial, BigDecimal densityKgPerLitre, String conversionNote,
		Scope scope, ActivityCategory category, LeaseType leaseType, BigDecimal quantity, String unit,
		String factorUnit, BigDecimal convertedQuantity, BigDecimal conversionFactor, BigDecimal kgCo2ePerUnit,
		BigDecimal weight, LocalDate periodStart, LocalDate periodEnd, long periodDays, long coveredDays,
		BigDecimal periodShare, String periodNote, BigDecimal kgCo2e, RunResponse.ByGas byGas, BigDecimal biogenicCo2Kg, String blendGwpSource,
		BigDecimal marketBasedKgCo2e, BigDecimal marketFactorKgCo2ePerKwh, MarketInstrument marketInstrument,
		String marketNote, BigDecimal marketCoveredKwh, BigDecimal marketBalanceKwh,
		BigDecimal marketBalanceKgCo2ePerKwh, Scope2MarketBasis marketBalanceBasis) {

	public static RunLineResponse from(GhgRunLine line) {
		return new RunLineResponse(line.getId(), line.getActivityId(), line.getRecordRef(), line.getFacilityId(), line.getFacilityName(),
				line.getEntityId(), line.getEntityName(), line.getCountry(), line.getActivityType(),
				line.getEvidenceRef(), line.getFactorId(), line.getFactorName(), line.getStreamName(),
				line.getScopeJustification(), line.isProxy(), line.getProxyJustification(), line.getDataQuality(),
				line.getDataQualityTier(), line.getUncertaintyPercent(), line.getEvidenceFiles(), line.getDensityMaterial(),
				line.getDensityKgPerLitre(), line.getConversionNote(), line.getScope(), line.getCategory(), line.getLeaseType(), line.getQuantity(),
				line.getUnit(), line.getFactorUnit(), line.getConvertedQuantity(), line.getConversionFactor(),
				line.getKgCo2ePerUnit(), line.getWeight(), line.getPeriodStart(), line.getPeriodEnd(),
				line.getPeriodDays(), line.getCoveredDays(), line.getPeriodShare(), line.getPeriodNote(),
				line.getKgCo2e(),
				new RunResponse.ByGas(line.getCo2Kg(), line.getCh4Kg(),
						line.isCh4Fossil() ? line.getCh4Kg() : BigDecimal.ZERO, line.getN2oKg(), line.getHfcsKg(),
						line.getPfcsKg(), line.getHfcsKgCo2e(), line.getPfcsKgCo2e(), line.getSf6Kg(), line.getNf3Kg()),
				line.getBiogenicCo2Kg(), line.getBlendGwpSource(), line.getMarketBasedKgCo2e(),
				line.getMarketFactorKgCo2ePerKwh(), line.getMarketInstrument(), line.getMarketNote(),
				line.getMarketCoveredKwh(), line.getMarketBalanceKwh(), line.getMarketBalanceKgCo2ePerKwh(),
				line.getMarketBalanceBasis());
	}
}
