package com.carbonos.ghg.internal.web.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.carbonos.ghg.internal.ConsolidationApproach;
import com.carbonos.ghg.internal.Inventory;

public record InventoryResponse(UUID id, UUID organizationId, String name, LocalDate periodStart,
		LocalDate periodEnd, String purpose, Integer baseYear, ConsolidationApproach consolidationApproach,
		UUID finalRunId, Instant createdAt) {

	public static InventoryResponse from(Inventory inventory) {
		return new InventoryResponse(inventory.getId(), inventory.getOrganization().getId(), inventory.getName(),
				inventory.getPeriodStart(), inventory.getPeriodEnd(), inventory.getPurpose(),
				inventory.getBaseYear(), inventory.getConsolidationApproach(), inventory.getFinalRunId(),
				inventory.getCreatedAt());
	}
}
