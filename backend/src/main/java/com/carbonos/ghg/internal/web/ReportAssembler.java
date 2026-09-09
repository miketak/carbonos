package com.carbonos.ghg.internal.web;

import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.carbonos.ghg.internal.BaseYearService;
import com.carbonos.ghg.internal.GhgService;
import com.carbonos.ghg.internal.InventoryService;
import com.carbonos.ghg.internal.web.dto.ReportResponse;

/** Assembles the Chapter 9 report composite for a run (spec 07.1), for the page and the exports (spec 07.5). */
@Component
public class ReportAssembler {

	private final InventoryService inventoryService;
	private final GhgService ghgService;
	private final BaseYearService baseYearService;

	ReportAssembler(InventoryService inventoryService, GhgService ghgService, BaseYearService baseYearService) {
		this.inventoryService = inventoryService;
		this.ghgService = ghgService;
		this.baseYearService = baseYearService;
	}

	@Transactional(readOnly = true)
	public ReportResponse assemble(UUID id) {

		var run = inventoryService.getRun(id);
		var inventory = inventoryService.get(run.getInventory().getId());
		var organization = ghgService.getOrganization(inventory.getOrganization().getId());
		var version = run.getBoundaryVersionId() == null ? null
				: inventoryService.getBoundaryVersion(run.getBoundaryVersionId());
		var baseYear = baseYearService.find(organization.getId()).orElse(null);
		var baseRun = baseYear == null || baseYear.getInventory().getFinalRunId() == null ? null
				: inventoryService.getRun(baseYear.getInventory().getFinalRunId());
		var recalculatedRuns = baseYear == null ? java.util.Map.<UUID, com.carbonos.ghg.internal.GhgRun>of()
				: baseYear.getRecalculations()
					.stream()
					.filter(r -> r.getRunId() != null)
					.collect(java.util.stream.Collectors.toMap(r -> r.getRunId(),
							r -> inventoryService.getRun(r.getRunId()), (a, b) -> a));
		var profile = baseYear == null ? java.util.List.<com.carbonos.ghg.internal.BaseYearService.ProfileEntry>of()
				: baseYearService.profile(baseYear, run.getPeriodEnd());
		var successor = inventory.getSupersededById() == null ? null
				: inventoryService.get(inventory.getSupersededById());
		return ReportResponse.of(run, inventory, organization, version, baseYear, baseRun, recalculatedRuns, profile,
				inventoryService.marketFactors(inventory.getId()), inventoryService.predecessors(inventory.getId()),
				successor, inventoryService.intensityMetrics(inventory.getId()));
	}
}
