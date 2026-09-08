package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.carbonos.ghg.internal.LegalEntity;
import com.carbonos.ghg.internal.RelationshipType;

public record EntityResponse(UUID id, String name, RelationshipType relationshipType,
		BigDecimal economicInterestPercent, BigDecimal legalOwnershipPercent, boolean operatedByCompany,
		boolean reportingCompany, BigDecimal equityShare, BigDecimal financialControlShare,
		BigDecimal operationalControlShare, Instant createdAt) {

	/** The entity plus the share Table 1 gives it under each approach, so the page can show all three. */
	public static EntityResponse from(LegalEntity entity) {
		return new EntityResponse(entity.getId(), entity.getName(), entity.getRelationshipType(),
				entity.getEconomicInterestPercent(), entity.getLegalOwnershipPercent(), entity.isOperatedByCompany(),
				entity.isReportingCompany(),
				entity.share(com.carbonos.ghg.internal.ConsolidationApproach.EQUITY_SHARE),
				entity.share(com.carbonos.ghg.internal.ConsolidationApproach.FINANCIAL_CONTROL),
				entity.share(com.carbonos.ghg.internal.ConsolidationApproach.OPERATIONAL_CONTROL),
				entity.getCreatedAt());
	}
}
