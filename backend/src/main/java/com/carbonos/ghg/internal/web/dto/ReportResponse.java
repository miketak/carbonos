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
import com.carbonos.ghg.internal.AssuranceLevel;
import com.carbonos.ghg.internal.GhgRunLine;
import com.carbonos.ghg.internal.IntensityMetric;
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
import com.carbonos.ghg.internal.Scope2MarketBasis;
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
		List<RunExclusionResponse> exclusions, List<RunLineResponse> lines, RunResponse run, Header header,
		List<CategoryFigure> byScope3Category, List<Breakdown> byFacility, List<Breakdown> byEntity,
		List<Breakdown> byCountry, List<FactorRow> factors, List<Intensity> intensity) {

	/** The report's header block (spec 07.4): who, for which entity, when, which version, with what assurance. */
	public record Header(String organizationName, String address, String contact, String periodLabel,
			LocalDate periodStart, LocalDate periodEnd, String preparedBy, Instant preparedAt, String approvedBy,
			String publishedBy, Instant publishedAt, int version, List<String> supersedes, String supersededBy,
			AssuranceLevel assuranceLevel, String assuranceProvider, String assuranceStatement) {
	}

	/** Emissions of one scope 3 category (spec 07.4). */
	public record CategoryFigure(ActivityCategory category, BigDecimal kgCo2e, BigDecimal tCo2e, int lineCount) {
	}

	/** Emissions of one facility, entity or country, split by scope (spec 07.4). */
	public record Breakdown(UUID id, String name, BigDecimal scope1KgCo2e, BigDecimal scope2KgCo2e,
			BigDecimal scope2MarketBasedKgCo2e, BigDecimal scope3KgCo2e, BigDecimal totalKgCo2e, BigDecimal totalTCo2e) {
	}

	/** One factor exactly as the run applied it (spec 07.4). */
	public record FactorRow(UUID factorId, String name, String unit, GwpSet gwpSet, BigDecimal kgCo2ePerUnit,
			BigDecimal co2, BigDecimal ch4, boolean ch4Fossil, BigDecimal n2o, BigDecimal hfcsKg, BigDecimal pfcsKg,
			BigDecimal sf6, BigDecimal nf3, BigDecimal biogenicCo2, String blendComposition, String blendGwpSource,
			String source) {
	}

	/** Total tCO2e per unit of an intensity denominator (spec 07.4). */
	public record Intensity(String name, BigDecimal value, String unit, BigDecimal tCo2ePerUnit) {
	}

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
			BigDecimal scope3TCo2e, BigDecimal totalTCo2e, String totalMethod, Scope2MarketBasis scope2MarketBasis,
			String baseYearScope2Method, Boolean baseYearMarketBasedIsProxy, Boolean residualMixAvailable,
			BigDecimal residualMixKgCo2ePerKwh, String residualMixDisclosure,
			List<MarketFactorResponse> marketInstruments) {
	}

	/** One of the seven gases: mass of the gas and CO2e, in kilograms and in tonnes. */
	public record Gas(String gas, BigDecimal kg, BigDecimal kgCo2e, BigDecimal tonnes, BigDecimal tCo2e) {
		static Gas of(String gas, BigDecimal kg, BigDecimal kgCo2e) {
			return new Gas(gas, kg, kgCo2e, ReportResponse.tonnes(kg), ReportResponse.tonnes(kgCo2e));
		}
	}

	public record BaseYearSection(int year, String periodLabel, String inventoryName, UUID inventoryId, BigDecimal thresholdPercent,
			String reason, StructuralChangeConvention structuralChangeConvention, boolean gwpSetMatches,
			RunFigure originalBase, List<Recalculation> recalculations, List<ProfileEntry> profile) {
	}

	/** One inventory in the emissions profile over time (spec 06.1): its final run and, for the base year, the recalculated one. */
	public record ProfileEntry(UUID inventoryId, String name, int year, String periodLabel, LocalDate periodStart,
			LocalDate periodEnd,
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
			List<BaseYearService.ProfileEntry> profile, List<MarketFactor> marketFactors,
			List<Inventory> predecessors, Inventory successor, List<IntensityMetric> metrics) {
		var lines = run.getLines().stream().map(RunLineResponse::from).toList();
		var header = new Header(organization.getName(), organization.getAddress(), organization.getContact(),
				inventory.periodLabel(), run.getPeriodStart(), run.getPeriodEnd(), run.getCreatedBy(),
				run.getCreatedAt(), inventory.getApprovedBy() != null ? inventory.getApprovedBy()
						: inventory.getPublishedBy(),
				inventory.getPublishedBy(), inventory.getPublishedAt(), predecessors.size() + 1,
				predecessors.stream().map(Inventory::getName).toList(),
				successor == null ? null : successor.getName(), inventory.getAssuranceLevel(),
				inventory.getAssuranceProvider(), inventory.getAssuranceStatement());
		var byCategory = new java.util.TreeMap<ActivityCategory, BigDecimal[]>();
		for (var line : run.getLines()) {
			if (line.getScope() == Scope.SCOPE_3) {
				var figure = byCategory.computeIfAbsent(line.getCategory(),
						c -> new BigDecimal[] { BigDecimal.ZERO, BigDecimal.ZERO });
				figure[0] = figure[0].add(line.getKgCo2e());
				figure[1] = figure[1].add(BigDecimal.ONE);
			}
		}
		var byScope3Category = byCategory.entrySet()
			.stream()
			.map(e -> new CategoryFigure(e.getKey(), e.getValue()[0], tonnes(e.getValue()[0]),
					e.getValue()[1].intValue()))
			.toList();
		var byFacility = breakdown(run, GhgRunLine::getFacilityId, GhgRunLine::getFacilityName);
		var byEntity = breakdown(run, GhgRunLine::getEntityId,
				line -> line.getEntityName() == null ? "not recorded" : line.getEntityName());
		var byCountry = breakdown(run, line -> null,
				line -> line.getCountry() == null ? "not recorded" : line.getCountry());
		var factorRows = run.getFactors()
			.stream()
			.map(f -> new FactorRow(f.getFactorId(), f.getName(), f.getUnit(), f.getGwpSet(), f.getKgCo2ePerUnit(),
					f.getCo2KgPerUnit(), f.getCh4KgPerUnit(), f.isCh4Fossil(), f.getN2oKgPerUnit(),
					f.getHfcsKgPerUnit(), f.getPfcsKgPerUnit(), f.getSf6KgPerUnit(), f.getNf3KgPerUnit(),
					f.getBiogenicCo2KgPerUnit(), f.getBlendComposition(), f.getBlendGwpSource(), f.getSource()))
			.toList();
		var intensity = metrics.stream()
			.map(m -> new Intensity(m.getName(), m.getValue(), m.getUnit(),
					tonnes(run.getTotalKgCo2e()).divide(m.getValue(), 6, java.math.RoundingMode.HALF_UP)))
			.toList();
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
				Gas.of("CH4", run.getCh4Kg(), run.ch4KgCo2e()),
				Gas.of("N2O", run.getN2oKg(), run.getN2oKg().multiply(gwp.n2o())),
				Gas.of("HFCs", run.getHfcsKg(), run.getHfcsKgCo2e()), Gas.of("PFCs", run.getPfcsKg(), run.getPfcsKgCo2e()),
				Gas.of("SF6", run.getSf6Kg(), run.getSf6Kg().multiply(gwp.sf6())),
				Gas.of("NF3", run.getNf3Kg(), run.getNf3Kg().multiply(gwp.nf3())));
		var sources = run.getLines().stream().map(line -> line.getFactorName()).distinct().sorted().toList();
		var reports = run.assessmentReports();
		var blendReports = reports.stream().skip(1).toList();
		var methane = gwp == GwpSet.AR6
				? " Methane of fossil origin is converted at " + gwp.ch4(true) + " and biogenic methane at "
						+ gwp.ch4(false) + " (IPCC AR6, Table 7.15 and Table 7.SM.7)."
				: " Methane is converted at " + gwp.ch4(true) + " whatever its origin (IPCC AR5, Table 8.A.1).";
		var potentials = "CO2e uses IPCC " + gwp.name() + " 100-year global warming potentials." + methane
				+ (blendReports.isEmpty()
						? " HFC and PFC blends are converted from their component gases with the same potentials."
						: " More than one assessment report was used: a blend whose composition is not recorded keeps "
								+ "the CO2e its source stated under IPCC " + String.join(" and ", blendReports) + ".");
		var failing = marketFactors.stream().filter(factor -> !factor.isMeetsQualityCriteria()).toList();
		var residualMixAvailable = inventory.getResidualMixAvailable();
		var residualMixDisclosure = residualMixAvailable == null
				? "The inventory does not state whether an adjusted residual mix is available for its markets; "
						+ "electricity no instrument covers is priced at the grid average (the location-based factor)."
				: residualMixAvailable
						? "An adjusted residual mix of " + inventory.getResidualMixKgCo2ePerKwh()
								+ " kg CO2e per kWh was available for the markets the instruments sit in."
						: "An adjusted emission factor (residual mix) is not available or has not been estimated to "
								+ "account for voluntary purchases in the markets the instruments sit in. This may "
								+ "result in double counting between electricity consumers.";
		var basis = switch (run.getScope2MarketBasis()) {
			case INSTRUMENTS -> "The market-based figure applies the contractual instruments listed to the "
					+ "kilowatt-hours they cover and prices the balance at "
					+ (Boolean.TRUE.equals(residualMixAvailable) ? "the residual mix."
							: "the grid average, since no residual mix is available.");
			case RESIDUAL_MIX -> "No contractual instrument was applied; the market-based figure prices every "
					+ "kilowatt-hour at the residual mix.";
			case GRID_AVERAGE -> "No contractual instrument was applied and no residual mix is available; the "
					+ "market-based figure equals the location-based figure, the grid average, as the Scope 2 "
					+ "Guidance allows.";
		};
		var failingClause = failing.isEmpty() ? ""
				: " " + failing.size() + " instrument" + (failing.size() == 1 ? "" : "s")
						+ " did not meet the Scope 2 Quality Criteria and " + (failing.size() == 1 ? "was" : "were")
						+ " not applied, as the lines state.";
		var scope2Methods = "Scope 2 is reported location-based and market-based, each labeled (Scope 2 Guidance, "
				+ "chapter 4). " + basis + failingClause + " The inventory total uses the location-based figure.";
		var proxies = run.getLines().stream().filter(GhgRunLine::isProxy).count();
		var proxyClause = proxies == 0 ? ""
				: " " + proxies + " line" + (proxies == 1 ? " uses" : "s use") + " a proxy factor for a source with no "
						+ "published factor, with the justification on the line.";
		var statement = "Emissions were calculated as activity data multiplied by an emission factor and the "
				+ "accounting share of the facility's legal entity under the " + describe(run.getConsolidationApproach())
				+ " approach (GHG Protocol Corporate Standard, Chapter 3, Table 1), applied at every level of the "
				+ "group. Activity data were converted into each factor's unit within its physical dimension "
				+ "only. " + potentials + " " + scope2Methods
				+ proxyClause + " Figures are stated in metric tonnes, with kilograms retained on every line."
				+ " Biogenic CO2 is reported outside the scopes.";
		// every run reports both methods (spec 07.3); a base year on the grid-average basis is a location-based proxy
		var baseYearScope2Method = baseRun == null ? null : "DUAL";
		var baseYearProxy = baseRun == null ? null : baseRun.getScope2MarketBasis() == Scope2MarketBasis.GRID_AVERAGE;
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
						entry.inventory().getPeriodStart().getYear(), entry.inventory().periodLabel(),
						entry.inventory().getPeriodStart(),
						entry.inventory().getPeriodEnd(), entry.inventory().getStatus(),
						entry.finalRun() == null ? null : entry.finalRun().getId(),
						entry.finalRun() == null ? null : entry.finalRun().getTotalKgCo2e(),
						entry.recalculatedRun() == null ? null : entry.recalculatedRun().getId(),
						entry.recalculatedRun() == null ? null : entry.recalculatedRun().getTotalKgCo2e()))
				.toList();
			baseYearSection = new BaseYearSection(baseYear.year(), baseYear.getInventory().periodLabel(),
					baseYear.getInventory().getName(),
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
						run.getScope2MarketBasis(), baseYearScope2Method, baseYearProxy, residualMixAvailable,
						inventory.getResidualMixKgCo2ePerKwh(), residualMixDisclosure,
						marketFactors.stream().map(MarketFactorResponse::from).toList()),
				byGas, run.getBiogenicCo2Kg(), tonnes(run.getBiogenicCo2Kg()), baseYearSection,
				new Methodology(gwp, run.getConsolidationApproach(), sources, reports, blendReports.size() > 0,
						statement),
				version == null ? List.of()
						: version.getExclusions().stream().map(BoundaryExclusionResponse::from).toList(),
				run.getExclusions().stream().map(RunExclusionResponse::from).toList(), lines,
				RunResponse.from(run), header, byScope3Category, byFacility, byEntity, byCountry, factorRows,
				intensity);
	}

	/** Lines grouped by a key, each group's scopes summed, sorted by total descending (spec 07.4). */
	private static List<Breakdown> breakdown(GhgRun run, java.util.function.Function<GhgRunLine, UUID> id,
			java.util.function.Function<GhgRunLine, String> name) {
		var groups = new java.util.LinkedHashMap<String, BigDecimal[]>();
		var ids = new java.util.HashMap<String, UUID>();
		for (var line : run.getLines()) {
			var key = name.apply(line);
			ids.putIfAbsent(key, id.apply(line));
			var sums = groups.computeIfAbsent(key, k -> new BigDecimal[] { BigDecimal.ZERO, BigDecimal.ZERO,
					BigDecimal.ZERO, BigDecimal.ZERO });
			switch (line.getScope()) {
				case SCOPE_1 -> sums[0] = sums[0].add(line.getKgCo2e());
				case SCOPE_2 -> {
					sums[1] = sums[1].add(line.getKgCo2e());
					sums[2] = sums[2].add(line.marketBasedOrLocationKgCo2e());
				}
				case SCOPE_3 -> sums[3] = sums[3].add(line.getKgCo2e());
			}
		}
		return groups.entrySet().stream().map(e -> {
			var s = e.getValue();
			var total = s[0].add(s[1]).add(s[3]);
			return new Breakdown(ids.get(e.getKey()), e.getKey(), s[0], s[1], s[2], s[3], total, tonnes(total));
		}).sorted(java.util.Comparator.comparing(Breakdown::totalKgCo2e).reversed()).toList();
	}

	private static RunFigure figure(GhgRun run) {
		return new RunFigure(run.getId(), run.getLabel(), run.getTotalKgCo2e(), run.getScope1KgCo2e(),
				run.getScope2KgCo2e(), run.getScope3KgCo2e());
	}

	private static String describe(ConsolidationApproach approach) {
		return approach.name().toLowerCase().replace('_', ' ');
	}
}
