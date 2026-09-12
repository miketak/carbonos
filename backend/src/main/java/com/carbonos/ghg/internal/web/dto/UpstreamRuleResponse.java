package com.carbonos.ghg.internal.web.dto;

import java.util.UUID;

import com.carbonos.ghg.internal.InventoryService;
import com.carbonos.ghg.internal.UpstreamRuleKind;

/** One upstream rule with the included records it derives a line from (spec 04.7). */
public record UpstreamRuleResponse(UUID id, UUID primaryFactorId, String primaryFactorName, UUID upstreamFactorId,
		String upstreamFactorName, UpstreamRuleKind kind, long matchingLines) {

	public static UpstreamRuleResponse from(InventoryService.UpstreamRuleView view) {
		var rule = view.rule();
		return new UpstreamRuleResponse(rule.getId(), rule.getPrimaryFactor().getId(),
				rule.getPrimaryFactor().getName(), rule.getUpstreamFactor().getId(),
				rule.getUpstreamFactor().getName(), rule.getKind(), view.matchingLines());
	}
}
