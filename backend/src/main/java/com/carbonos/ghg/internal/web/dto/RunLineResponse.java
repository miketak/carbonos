package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.GhgRunLine;
import com.carbonos.ghg.internal.LeaseType;
import com.carbonos.ghg.internal.MarketInstrument;
import com.carbonos.ghg.internal.Scope;

public record RunLineResponse(UUID id, UUID activityId, UUID facilityId, String facilityName, String factorName,
		Scope scope, ActivityCategory category, LeaseType leaseType, BigDecimal quantity, String unit,
		String factorUnit, BigDecimal convertedQuantity, BigDecimal conversionFactor, BigDecimal kgCo2ePerUnit,
		BigDecimal weight, BigDecimal kgCo2e, RunResponse.ByGas byGas, BigDecimal biogenicCo2Kg,
		BigDecimal marketBasedKgCo2e, BigDecimal marketFactorKgCo2ePerKwh, MarketInstrument marketInstrument) {

	public static RunLineResponse from(GhgRunLine line) {
		return new RunLineResponse(line.getId(), line.getActivityId(), line.getFacilityId(), line.getFacilityName(),
				line.getFactorName(), line.getScope(), line.getCategory(), line.getLeaseType(), line.getQuantity(),
				line.getUnit(), line.getFactorUnit(), line.getConvertedQuantity(), line.getConversionFactor(),
				line.getKgCo2ePerUnit(), line.getWeight(), line.getKgCo2e(),
				new RunResponse.ByGas(line.getCo2Kg(), line.getCh4Kg(), line.getN2oKg(), line.getHfcsKgCo2e(),
						line.getPfcsKgCo2e(), line.getSf6Kg(), line.getNf3Kg()),
				line.getBiogenicCo2Kg(), line.getMarketBasedKgCo2e(), line.getMarketFactorKgCo2ePerKwh(),
				line.getMarketInstrument());
	}
}
