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
import com.carbonos.ghg.internal.BaseYearService;
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
import com.carbonos.ghg.internal.StructuralChangeConvention;

/**
 * The inventory report for one run, laid out as Chapter 9 requires (spec
 * 07.1): the company and its boundary, the operational boundary, the period,
 * emissions by scope (scope 2 both ways), each gas, biogenic CO2, the base
 * year with its recalculation history, methodology, exclusions, and the lines.
 */
public record ReportResponse(Company company, OperationalBoundary operationalBoundary, Period period,
		Emissions emissions, List<Gas> byGas, BigDecimal biogenicCo2Kg, BigDecimal biogenicCo2T,
		BaseYearSection baseYear, Methodology methodology, List<BoundaryExclusionResponse> boundaryExclusions,
		List<RunExclusionResponse> exclusions, List<RunLineResponse> lines, RunResponse run) {

	/** Chapter 9 asks for metric tonnes: kilograms to three decimals of a tonne. */
	static BigDecimal tonnes(BigDecimal kg) {
		return kg == null ? null : kg.movePointLeft(3).setScale(3, java.math.RoundingMode.HALF_UP);
	}

	public record Company(String organizationName, ConsolidationApproach consolidationApproach,
			BoundaryVersionResponse boundaryVersion) {
	}

	public record OperationalBoundary(List<Scope> scopesCovered, List<ActivityCategory> scope3Categories,
			List<ActivityCategory> scope3CategoriesReported, String exclusionsRationale) {
	}

	public record Period(LocalDate periodStart, LocalDate periodEnd, String inventoryName, InventoryStatus status,
			Instant publishedAt, UUID supersededById) {
	}

	/**
	 * Emissions by scope in kilograms and in tonnes, scope 2 both ways, and the
	 * Scope 2 Guidance disclosures (spec 07.2): which method the total uses,
	 * how the base year's scope 2 was calculated, whether the residual mix was
	 * available, and the instruments with their Quality Criteria assessment.
	 */
	public record Emissions(BigDecimal scope1KgCo2e, BigDecimal scope2LocationBasedKgCo2e,
			BigDecimal scope2MarketBasedKgCo2e, BigDecimal scope3KgCo2e, BigDecimal totalKgCo2e,
			BigDecimal scope1TCo2e, BigDecimal scope2LocationBasedTCo2e, BigDecimal scope2MarketBasedTCo2e,
			BigDecimal scope3TCo2e, BigDecimal totalTCo2e, String totalMethod, String baseYearScope2Method,
			Boolean baseYearMarketBasedIsProxy, Boolean residualMixAvailable, BigDecimal residualMixKgCo2ePerKwh,
			String residualMixDisclosure, List<MarketFactorResponse> marketInstruments) {
	}

	/** One of the seven gases: mass of the gas and CO2e, in kilograms and in tonnes. */
	public record Gas(String gas, BigDecimal kg, BigDecimal kgCo2e, BigDecimal tonnes, BigDecimal tCo2e) {
		static Gas of(String gas, BigDecimal kg, BigDecimal kgCo2e) {
			return new Gas(gas, kg, kgCo2e, ReportResponse.tonnes(kg), ReportResponse.tonnes(kgCo2e));
		}
	}

	public record BaseYearSection(int year, String inventoryName, UUID inventoryId, BigDecimal thresholdPercent,
			String reason, StructuralChangeConvention structuralChangeConvention, boolean gwpSetMatches,
			RunFigure originalBase, List<Recalculation> recalculations, List<ProfileEntry> profile) {
	}

	/** One inventory in the emissions profile over time (spec 06.1): its final run and, for the base year, the recalculated one. */
	public record ProfileEntry(UUID inventoryId, String name, int year, LocalDate periodStart, LocalDate periodEnd,
			InventoryStatus status, UUID finalRunId, BigDecimal totalKgCo2e, UUID recalculatedRunId,
			BigDecimal recalculatedTotalKgCo2e) {
	}

	public record RunFigure(UUID runId, String label, BigDecimal totalKgCo2e, BigDecimal scope1KgCo2e,
			BigDecimal scope2KgCo2e, BigDecimal scope3KgCo2e) {
	}

	public record Recalculation(BaseYearResponse.RecalculationResponse decision, RunFigure recalculatedBase) {
	}

	public record Methodology(GwpSet gwpSet, ConsolidationApproach consolidationApproach, List<String> factorSources,
			List<String> assessmentReports, boolean multipleAssessmentReports, String statement) {
	}

	public static ReportResponse of(GhgRun run, Inventory inventory, Organization organization,
			BoundaryVersion version, BaseYear baseYear, GhgRun baseRun, Map<UUID, GhgRun> recalculatedRuns,
			List<BaseYearService.ProfileEntry> profile, List<MarketFactor> marketFactors) {
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
		var byGas = List.of(Gas.of("CO2", run.getCo2Kg(), run.getCo2Kg()),
				Gas.of("CH4", run.getCh4Kg(), run.getCh4Kg().multiply(gwp.ch4())),
				Gas.of("N2O", run.getN2oKg(), run.getN2oKg().multiply(gwp.n2o())),
				Gas.of("HFCs", run.getHfcsKg(), run.getHfcsKgCo2e()), Gas.of("PFCs", run.getPfcsKg(), run.getPfcsKgCo2e()),
				Gas.of("SF6", run.getSf6Kg(), run.getSf6Kg().multiply(gwp.sf6())),
				Gas.of("NF3", run.getNf3Kg(), run.getNf3Kg().multiply(gwp.nf3())));
		var sources = run.getLines().stream().map(line -> line.getFactorName()).distinct().sorted().toList();
		var reports = run.assessmentReports();
		var blendReports = reports.stream().skip(1).toList();
		var potentials = "CO2e uses IPCC " + gwp.name() + " 100-year global warming potentials"
				+ (blendReports.isEmpty() ? "; the HFC and PFC blends used the same report."
						: ". More than one assessment report was used: the HFC and PFC blends keep the potentials of IPCC "
								+ String.join(" and ", blendReports) + " that their source applied.");
		var failing = marketFactors.stream().filter(factor -> !factor.isMeetsQualityCriteria()).toList();
		var residualMixAvailable = inventory.getResidualMixAvailable();
		var residualMixDisclosure = run.getScope2MarketBasedKgCo2e() == null ? null
				: Boolean.TRUE.equals(residualMixAvailable)
						? "An adjusted residual mix of " + inventory.getResidualMixKgCo2ePerKwh()
								+ " kg CO2e per kWh was available for the markets the instruments sit in."
						: "An adjusted emission factor (residual mix) is not available or has not been estimated to "
								+ "account for voluntary purchases in the markets the instruments sit in. This may "
								+ "result in double counting between electricity consumers.";
		var scope2Methods = run.getScope2MarketBasedKgCo2e() == null ? "Scope 2 is reported location-based only."
				: "Scope 2 is reported location-based and market-based, each labeled, using the contractual "
						+ "instruments listed" + (failing.isEmpty() ? "."
								: "; " + failing.size() + " instrument" + (failing.size() == 1 ? "" : "s")
										+ " did not meet the Scope 2 Quality Criteria and " + (failing.size() == 1
												? "was" : "were") + " replaced as the lines state.")
						+ " The inventory total uses the location-based figure.";
		var statement = "Emissions were calculated as activity data multiplied by an emission factor and the "
				+ "accounting share of the facility's legal entity under the " + describe(run.getConsolidationApproach())
				+ " approach (GHG Protocol Corporate Standard, Chapter 3, Table 1), applied at every level of the "
				+ "group. Activity data were converted into each factor's unit within its physical dimension "
				+ "only. " + potentials + " " + scope2Methods
				+ " Figures are stated in metric tonnes, with kilograms retained on every line."
				+ " Biogenic CO2 is reported outside the scopes.";
		var baseYearScope2Method = baseRun == null ? null
				: baseRun.getScope2MarketBasedKgCo2e() == null ? "LOCATION_BASED" : "DUAL";
		var baseYearProxy = baseRun == null ? null : baseRun.getScope2MarketBasedKgCo2e() == null;
		BaseYearSection baseYearSection = null;
		if (baseYear != null) {
			var recalculations = new ArrayList<Recalculation>();
			for (var candidate : baseYear.getRecalculations()) {
				var recalculated = candidate.getStatus() == RecalculationStatus.RECALCULATED
						&& candidate.getRunId() != null ? recalculatedRuns.get(candidate.getRunId()) : null;
				recalculations.add(new Recalculation(BaseYearResponse.RecalculationResponse.from(candidate),
						recalculated == null ? null : figure(recalculated)));
			}
			var profileEntries = profile.stream()
				.map(entry -> new ProfileEntry(entry.inventory().getId(), entry.inventory().getName(),
						entry.inventory().getPeriodStart().getYear(), entry.inventory().getPeriodStart(),
						entry.inventory().getPeriodEnd(), entry.inventory().getStatus(),
						entry.finalRun() == null ? null : entry.finalRun().getId(),
						entry.finalRun() == null ? null : entry.finalRun().getTotalKgCo2e(),
						entry.recalculatedRun() == null ? null : entry.recalculatedRun().getId(),
						entry.recalculatedRun() == null ? null : entry.recalculatedRun().getTotalKgCo2e()))
				.toList();
			baseYearSection = new BaseYearSection(baseYear.year(), baseYear.getInventory().getName(),
					baseYear.getInventory().getId(), baseYear.getThresholdPercent(), baseYear.getReason(),
					baseYear.getStructuralChangeConvention(), baseYear.getInventory().getGwpSet() == run.getGwpSet(),
					baseRun == null ? null : figure(baseRun), recalculations, profileEntries);
		}
		return new ReportResponse(
				new Company(organization.getName(), run.getConsolidationApproach(),
						version == null ? null : BoundaryVersionResponse.from(version)),
				new OperationalBoundary(List.copyOf(scopesCovered), inventory.getScope3Categories(),
						List.copyOf(scope3Reported), inventory.getScope3ExclusionsRationale()),
				new Period(run.getPeriodStart(), run.getPeriodEnd(), inventory.getName(), inventory.getStatus(),
						inventory.getPublishedAt(), inventory.getSupersededById()),
				new Emissions(run.getScope1KgCo2e(), run.getScope2KgCo2e(), run.getScope2MarketBasedKgCo2e(),
						run.getScope3KgCo2e(), run.getTotalKgCo2e(), tonnes(run.getScope1KgCo2e()),
						tonnes(run.getScope2KgCo2e()), tonnes(run.getScope2MarketBasedKgCo2e()),
						tonnes(run.getScope3KgCo2e()), tonnes(run.getTotalKgCo2e()), "LOCATION_BASED",
						baseYearScope2Method, baseYearProxy, residualMixAvailable,
						inventory.getResidualMixKgCo2ePerKwh(), residualMixDisclosure,
						marketFactors.stream().map(MarketFactorResponse::from).toList()),
				byGas, run.getBiogenicCo2Kg(), tonnes(run.getBiogenicCo2Kg()), baseYearSection,
				new Methodology(gwp, run.getConsolidationApproach(), sources, reports, blendReports.size() > 0,
						statement),
				version == null ? List.of()
						: version.getExclusions().stream().map(BoundaryExclusionResponse::from).toList(),
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
