package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.BaseYear;
import com.carbonos.ghg.internal.BoundaryVersion;
import com.carbonos.ghg.internal.ConsolidationApproach;
import com.carbonos.ghg.internal.GhgRun;
import com.carbonos.ghg.internal.GwpSet;
import com.carbonos.ghg.internal.Inventory;
import com.carbonos.ghg.internal.InventoryStatus;
import com.carbonos.ghg.internal.MarketFactor;
import com.carbonos.ghg.internal.Organization;
import com.carbonos.ghg.internal.RecalculationStatus;
import com.carbonos.ghg.internal.Scope;

/**
 * The inventory report for one run, laid out as Chapter 9 requires (spec
 * 07.1): the company and its boundary, the operational boundary, the period,
 * emissions by scope (scope 2 both ways), each gas, biogenic CO2, the base
 * year with its recalculation history, methodology, exclusions, and the lines.
 */
public record ReportResponse(Company company, OperationalBoundary operationalBoundary, Period period,
		Emissions emissions, List<Gas> byGas, BigDecimal biogenicCo2Kg, BaseYearSection baseYear,
		Methodology methodology, List<RunExclusionResponse> exclusions, List<RunLineResponse> lines,
		RunResponse run) {

	public record Company(String organizationName, ConsolidationApproach consolidationApproach,
			BoundaryVersionResponse boundaryVersion) {
	}

	public record OperationalBoundary(List<Scope> scopesCovered, List<ActivityCategory> scope3Categories,
			List<ActivityCategory> scope3CategoriesReported, String exclusionsRationale) {
	}

	public record Period(LocalDate periodStart, LocalDate periodEnd, String inventoryName, InventoryStatus status,
			Instant publishedAt, UUID supersededById) {
	}

	public record Emissions(BigDecimal scope1KgCo2e, BigDecimal scope2LocationBasedKgCo2e,
			BigDecimal scope2MarketBasedKgCo2e, BigDecimal scope3KgCo2e, BigDecimal totalKgCo2e,
			List<MarketFactorResponse> marketInstruments) {
	}

	/** One of the seven gases: kg of the gas (null for blends) and kg CO2e under the run's GWP set. */
	public record Gas(String gas, BigDecimal kg, BigDecimal kgCo2e) {
	}

	public record BaseYearSection(int year, String inventoryName, UUID inventoryId, BigDecimal thresholdPercent,
			BaseYearRequest.Triggers triggers, RunFigure originalBase, List<Recalculation> recalculations) {
	}

	public record RunFigure(UUID runId, String label, BigDecimal totalKgCo2e, BigDecimal scope1KgCo2e,
			BigDecimal scope2KgCo2e, BigDecimal scope3KgCo2e) {
	}

	public record Recalculation(BaseYearResponse.RecalculationResponse decision, RunFigure recalculatedBase) {
	}

	public record Methodology(GwpSet gwpSet, ConsolidationApproach consolidationApproach, List<String> factorSources,
			String statement) {
	}

	public static ReportResponse of(GhgRun run, Inventory inventory, Organization organization,
			BoundaryVersion version, BaseYear baseYear, GhgRun baseRun, Map<UUID, GhgRun> recalculatedRuns,
			List<MarketFactor> marketFactors) {
		var lines = run.getLines().stream().map(RunLineResponse::from).toList();
		var scopesCovered = EnumSet.noneOf(Scope.class);
		var scope3Reported = EnumSet.noneOf(ActivityCategory.class);
		for (var line : run.getLines()) {
			scopesCovered.add(line.getScope());
			if (line.getScope() == Scope.SCOPE_3) {
				scope3Reported.add(line.getCategory());
			}
		}
		var gwp = run.getGwpSet();
		var byGas = List.of(new Gas("CO2", run.getCo2Kg(), run.getCo2Kg()),
				new Gas("CH4", run.getCh4Kg(), run.getCh4Kg().multiply(gwp.ch4())),
				new Gas("N2O", run.getN2oKg(), run.getN2oKg().multiply(gwp.n2o())),
				new Gas("HFCs", null, run.getHfcsKgCo2e()), new Gas("PFCs", null, run.getPfcsKgCo2e()),
				new Gas("SF6", run.getSf6Kg(), run.getSf6Kg().multiply(gwp.sf6())),
				new Gas("NF3", run.getNf3Kg(), run.getNf3Kg().multiply(gwp.nf3())));
		var sources = run.getLines().stream().map(line -> line.getFactorName()).distinct().sorted().toList();
		var statement = "Emissions were calculated as activity data multiplied by an emission factor and the "
				+ "accounting share of the facility's legal entity under the " + describe(run.getConsolidationApproach())
				+ " approach (GHG Protocol Corporate Standard, Chapter 3, Table 1). Activity data were converted "
				+ "into each factor's unit within its physical dimension only. CO2e uses IPCC " + gwp.name()
				+ " 100-year global warming potentials; HFC and PFC blends use the factor source's potentials. "
				+ "Scope 2 is reported location-based" + (run.getScope2MarketBasedKgCo2e() != null
						? " and market-based, using the contractual instruments listed." : ".")
				+ " Biogenic CO2 is reported outside the scopes.";
		BaseYearSection baseYearSection = null;
		if (baseYear != null) {
			var recalculations = new ArrayList<Recalculation>();
			for (var candidate : baseYear.getRecalculations()) {
				var recalculated = candidate.getStatus() == RecalculationStatus.RECALCULATED
						&& candidate.getRunId() != null ? recalculatedRuns.get(candidate.getRunId()) : null;
				recalculations.add(new Recalculation(BaseYearResponse.RecalculationResponse.from(candidate),
						recalculated == null ? null : figure(recalculated)));
			}
			baseYearSection = new BaseYearSection(baseYear.getInventory().getPeriodStart().getYear(),
					baseYear.getInventory().getName(), baseYear.getInventory().getId(),
					baseYear.getThresholdPercent(),
					new BaseYearRequest.Triggers(baseYear.isTriggerStructural(), baseYear.isTriggerMethodology(),
							baseYear.isTriggerErrors()),
					baseRun == null ? null : figure(baseRun), recalculations);
		}
		return new ReportResponse(
				new Company(organization.getName(), run.getConsolidationApproach(),
						version == null ? null : BoundaryVersionResponse.from(version)),
				new OperationalBoundary(List.copyOf(scopesCovered), inventory.getScope3Categories(),
						List.copyOf(scope3Reported), inventory.getScope3ExclusionsRationale()),
				new Period(run.getPeriodStart(), run.getPeriodEnd(), inventory.getName(), inventory.getStatus(),
						inventory.getPublishedAt(), inventory.getSupersededById()),
				new Emissions(run.getScope1KgCo2e(), run.getScope2KgCo2e(), run.getScope2MarketBasedKgCo2e(),
						run.getScope3KgCo2e(), run.getTotalKgCo2e(),
						marketFactors.stream().map(MarketFactorResponse::from).toList()),
				byGas, run.getBiogenicCo2Kg(), baseYearSection,
				new Methodology(gwp, run.getConsolidationApproach(), sources, statement),
				run.getExclusions().stream().map(RunExclusionResponse::from).toList(), lines,
				RunResponse.from(run));
	}

	private static RunFigure figure(GhgRun run) {
		return new RunFigure(run.getId(), run.getLabel(), run.getTotalKgCo2e(), run.getScope1KgCo2e(),
				run.getScope2KgCo2e(), run.getScope3KgCo2e());
	}

	private static String describe(ConsolidationApproach approach) {
		return approach.name().toLowerCase().replace('_', ' ');
	}
}
