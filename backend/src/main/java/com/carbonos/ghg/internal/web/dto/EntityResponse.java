package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.internal.ConsolidationApproach;
import com.carbonos.ghg.internal.LegalEntity;
import com.carbonos.ghg.internal.RelationshipType;

public record EntityResponse(UUID id, String name, RelationshipType relationshipType,
		BigDecimal economicInterestPercent, BigDecimal legalOwnershipPercent, boolean operatedByCompany,
		boolean controlledByCompany, UUID parentEntityId, BigDecimal effectiveEconomicInterestPercent,
		List<String> chain, boolean reportingCompany, BigDecimal equityShare, BigDecimal financialControlShare,
		BigDecimal operationalControlShare, Instant createdAt) {

	/** The entity plus the share Table 1 gives it under each approach, chain included, so the page can show all three. */
	public static EntityResponse from(LegalEntity entity) {
		return new EntityResponse(entity.getId(), entity.getName(), entity.getRelationshipType(),
				entity.getEconomicInterestPercent(), entity.getLegalOwnershipPercent(), entity.isOperatedByCompany(),
				entity.isControlledByCompany(), entity.getParent() == null ? null : entity.getParent().getId(),
				entity.effectiveEconomicInterestPercent(), entity.chain(), entity.isReportingCompany(),
				entity.share(ConsolidationApproach.EQUITY_SHARE), entity.share(ConsolidationApproach.FINANCIAL_CONTROL),
				entity.share(ConsolidationApproach.OPERATIONAL_CONTROL), entity.getCreatedAt());
	}
}
