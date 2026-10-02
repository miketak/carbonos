package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import com.carbonos.ghg.internal.export.ReportLabels;

/**
 * The arithmetic of one run line (specs 04.2, 04.7, 07.3, 07.7), apart from
 * the service that reads the inventory and saves the run: the two shares, the
 * conversion, the kg CO2e and every gas column, the market-based side of a
 * scope 2 line, and the category 3 line an upstream rule derives. Pure
 * functions over the entities, so the figures are checked against hand-computed
 * vectors without a database.
 */
final class LineMath {

	static final String KWH = "kWh";

	private static final DecimalFormat KWH_FORMAT = new DecimalFormat("#,##0.###",
			DecimalFormatSymbols.getInstance(Locale.ROOT));

	private LineMath() {
	}

	/** A primary line with the figures its derived lines ride on. */
	record Primary(GhgRunLine line, BigDecimal convertedQuantity, BigDecimal conversionFactor, BigDecimal share,
			BigDecimal periodShare, GhgRunLine.Period period, String evidenceFiles, GhgRunLine.Market market) {
	}

	/** Stored to three decimals of a kilogram, half up. */
	static BigDecimal round(BigDecimal value) {
		return value.setScale(3, RoundingMode.HALF_UP);
	}

	/**
	 * One gas of a line (spec 07.7): the counted quantity (already pro-rated by
	 * the period share) times the factor's per-unit component times the
	 * accounting share, stored to three decimals of a kilogram.
	 */
	static BigDecimal gas(BigDecimal counted, BigDecimal componentPerUnit, BigDecimal share) {
		return round(counted.multiply(componentPerUnit).multiply(share));
	}

	/** The accounting share the version holds for the facility; nothing when no day of the record is covered. */
	static BigDecimal accountingShare(BoundaryVersion.Coverage coverage) {
		return coverage.coveredDays() == 0 ? BigDecimal.ZERO : coverage.share();
	}

	/** The share of the record's days inside the period and the membership window, to six decimals (spec 04.2). */
	static BigDecimal periodShare(BoundaryVersion.Coverage coverage) {
		return coverage.coveredDays() == coverage.totalDays() ? BigDecimal.ONE
				: BigDecimal.valueOf(coverage.coveredDays())
					.divide(BigDecimal.valueOf(coverage.totalDays()), 6, RoundingMode.HALF_UP);
	}

	/** The record's period as the line carries it, with the pro-rating note when a day was left out. */
	static GhgRunLine.Period period(LocalDate start, LocalDate end, BoundaryVersion.Coverage coverage) {
		var periodShare = periodShare(coverage);
		return new GhgRunLine.Period(start, end, coverage.totalDays(), coverage.coveredDays(), periodShare,
				periodShare.compareTo(BigDecimal.ONE) == 0 ? null
						: "pro-rated: " + coverage.coveredDays() + " of " + coverage.totalDays()
								+ " days inside the reporting period and the membership window ("
								+ periodShare.movePointRight(2).setScale(2, RoundingMode.HALF_UP).stripTrailingZeros().toPlainString()
								+ "%)");
	}

	/** Every gas column of a line: the same two shares as its kg CO2e, so the gas contributions tie to it (spec 07.7). */
	static GhgRunLine.Gases gases(EmissionFactor factor, GwpSet gwp, BigDecimal counted, BigDecimal share) {
		return new GhgRunLine.Gases(gas(counted, factor.getCo2KgPerUnit(), share),
				gas(counted, factor.getCh4KgPerUnit(), share), gas(counted, factor.getN2oKgPerUnit(), share),
				gas(counted, factor.hfcsKgCo2ePerUnit(gwp), share), gas(counted, factor.pfcsKgCo2ePerUnit(gwp), share),
				gas(counted, factor.getSf6KgPerUnit(), share), gas(counted, factor.getNf3KgPerUnit(), share),
				gas(counted, factor.getBiogenicCo2KgPerUnit(), share), gas(counted, factor.getHfcsKgPerUnit(), share),
				gas(counted, factor.getPfcsKgPerUnit(), share), factor.blendGwpSourceFor(gwp), factor.isCh4Fossil());
	}

	/**
	 * The line of an included record: converted into the factor's unit, pro-rated
	 * by the days the version covers, priced under the run's GWP set and weighted
	 * by the accounting share; with its market-based side when it is scope 2.
	 */
	static Primary primaryLine(GhgRun run, InventoryAssignment assignment, BoundaryVersion.Coverage coverage,
			UnitConverter.Scoped units, GwpSet gwp, MarketFactor instrument, Map<UUID, BigDecimal> remainingCoverage,
			String evidenceFiles) {
		var activity = assignment.getActivity();
		var factor = assignment.getEmissionFactor();
		var inventory = assignment.getInventory();
		var share = accountingShare(coverage);
		var periodShare = periodShare(coverage);
		var period = period(activity.getPeriodStart(), activity.getPeriodEnd(), coverage);
		var quantity = activity.getQuantity();
		var activityUnit = activity.getUnit();
		var factorUnit = factor.getUnit();
		// spec 02.2: within a dimension, through a custom unit, or through a density; the gate proved it converts
		var conversion = Conversion.of(units, quantity, activityUnit, factorUnit, assignment.getDensity())
			.orElse(new Conversion(quantity, BigDecimal.ONE, null, false));
		var conversionFactor = conversion.factor();
		var convertedQuantity = conversion.convertedQuantity();
		var perUnit = factor.kgCo2ePerUnit(gwp);
		var counted = convertedQuantity.multiply(periodShare);
		var kgCo2e = round(counted.multiply(perUnit).multiply(share));
		var gases = gases(factor, gwp, counted, share);
		GhgRunLine.Market market = null;
		if (assignment.getScope() == Scope.SCOPE_2) {
			market = marketBased(units, inventory, assignment, instrument, remainingCoverage, counted, perUnit, share,
					periodShare, kgCo2e);
		}
		var line = new GhgRunLine(run, assignment, convertedQuantity, conversionFactor, perUnit, share, period,
				kgCo2e, gases, market, evidenceFiles != null && evidenceFiles.length() > 1000
						? evidenceFiles.substring(0, 997) + "..." : evidenceFiles,
				conversion.note() != null && conversion.note().length() > 500
						? conversion.note().substring(0, 497) + "..." : conversion.note());
		return new Primary(line, convertedQuantity, conversionFactor, share, periodShare, period, evidenceFiles,
				market);
	}

	/**
	 * The market-based side of a scope 2 line: the facility's instrument applied
	 * to the kWh it still covers, the balance at the residual mix or the grid
	 * average (the line's own location-based factor), and a note that prints
	 * the split. Purchased heat, steam and cooling, and lines that do not
	 * convert to kWh, keep their location-based figure.
	 */
	static GhgRunLine.Market marketBased(UnitConverter.Scoped units, Inventory inventory,
			InventoryAssignment assignment, MarketFactor instrument, Map<UUID, BigDecimal> remainingCoverage,
			BigDecimal convertedQuantity, BigDecimal perUnit, BigDecimal share, BigDecimal periodShare,
			BigDecimal locationKgCo2e) {
		var activity = assignment.getActivity();
		if (assignment.getCategory() != ActivityCategory.PURCHASED_ELECTRICITY) {
			return new GhgRunLine.Market(locationKgCo2e, null, null, "no contractual instrument applies to '"
					+ ReportLabels.label(assignment.getCategory()) + "'; the location-based figure stands",
					BigDecimal.ZERO, BigDecimal.ZERO, null, null);
		}
		if (!units.canConvert(activity.getUnit(), KWH)) {
			return new GhgRunLine.Market(locationKgCo2e, null, null, "recorded in " + activity.getUnit()
					+ ", which does not convert to kWh; the location-based figure stands", BigDecimal.ZERO,
					BigDecimal.ZERO, null, null);
		}
		// the kWh the run counts: the record's, pro-rated like the location-based side (spec 04.2)
		var kwh = units.convert(activity.getQuantity(), activity.getUnit(), KWH).multiply(periodShare);
		var locationPerKwh = kwh.signum() == 0 ? BigDecimal.ZERO
				: convertedQuantity.multiply(perUnit).divide(kwh, MathContext.DECIMAL64);
		var covered = BigDecimal.ZERO;
		BigDecimal instrumentFactor = null;
		MarketInstrument applied = null;
		var parts = new ArrayList<String>();
		if (instrument == null) {
			parts.add("no contractual instrument");
		}
		else if (!instrument.overlaps(activity.getPeriodStart(), activity.getPeriodEnd(), inventory)) {
			parts.add("the facility's instrument covers " + instrument.effectiveStart(inventory) + " to "
					+ instrument.effectiveEnd(inventory) + ", not this record's period");
		}
		else if (!instrument.isMeetsQualityCriteria()) {
			// Scope 2 Guidance: an instrument that fails the Quality Criteria is replaced by other data
			parts.add("the facility's instrument does not meet the Scope 2 Quality Criteria and was not applied");
		}
		else {
			var facilityId = activity.getFacility().getId();
			var left = remainingCoverage.get(facilityId);
			covered = left == null ? kwh : kwh.min(left.max(BigDecimal.ZERO));
			if (left != null) {
				remainingCoverage.put(facilityId, left.subtract(covered));
			}
			if (covered.signum() > 0) {
				instrumentFactor = instrument.getKgCo2ePerKwh();
				applied = instrument.getInstrumentType();
				parts.add(kwh(covered) + " kWh at " + plain(instrumentFactor) + " kg/kWh ("
						+ instrument.getInstrumentType().name().toLowerCase().replace('_', ' ') + ")");
			}
			else {
				parts.add("the facility's instrument is used up by earlier records");
			}
		}
		var balance = kwh.subtract(covered);
		var residualAvailable = Boolean.TRUE.equals(inventory.getResidualMixAvailable())
				&& inventory.getResidualMixKgCo2ePerKwh() != null;
		var balanceFactor = residualAvailable ? inventory.getResidualMixKgCo2ePerKwh() : locationPerKwh;
		Scope2MarketBasis basis = null;
		if (balance.signum() > 0) {
			basis = residualAvailable ? Scope2MarketBasis.RESIDUAL_MIX : Scope2MarketBasis.GRID_AVERAGE;
			parts.add(kwh(balance) + " kWh at " + plain(balanceFactor) + " kg/kWh (" + (residualAvailable
					? "residual mix"
					: "grid average: the location-based figure stands, " + (inventory.getResidualMixAvailable() == null
							? "residual-mix availability not stated" : "no residual mix is available"))
					+ ")");
		}
		var kgCo2e = round(covered.multiply(instrumentFactor == null ? BigDecimal.ZERO : instrumentFactor)
			.add(balance.multiply(balanceFactor))
			.multiply(share));
		var reported = applied != null ? applied
				: basis == Scope2MarketBasis.RESIDUAL_MIX ? MarketInstrument.RESIDUAL_MIX : null;
		var factorShown = instrumentFactor != null ? instrumentFactor : balance.signum() > 0 ? balanceFactor : null;
		return new GhgRunLine.Market(kgCo2e, factorShown, reported, String.join("; ", parts), covered, balance,
				balance.signum() > 0 ? balanceFactor : null, basis);
	}

	/**
	 * One derived category 3 line (spec 04.7): the primary line's record,
	 * facility, entity, country, period, quantity, accounting share and period
	 * share, priced at the upstream factor's rate under the run's GWP set. It
	 * carries the primary line's stream, tier, uncertainty and evidence, is a
	 * proxy only when the primary line is, and never carries a market-based
	 * figure, an instrument or a lease type.
	 */
	static GhgRunLine derivedLine(GhgRun run, InventoryAssignment assignment, GhgRunLine primary,
			UpstreamRule rule, UnitConverter.Scoped units, GwpSet gwp, BigDecimal primaryConvertedQuantity,
			BigDecimal primaryConversionFactor, BigDecimal share, BigDecimal periodShare, GhgRunLine.Period period,
			String evidenceFiles, GhgRunLine.Market market) {
		var upstream = rule.getUpstreamFactor();
		var primaryUnit = assignment.getEmissionFactor().getUnit();
		// the rule refused a pair whose units do not convert, so the ratio always exists
		var ratio = units.canConvert(primaryUnit, upstream.getUnit()) ? units.ratio(primaryUnit, upstream.getUnit())
				: BigDecimal.ONE;
		var converted = primaryConvertedQuantity.multiply(ratio, MathContext.DECIMAL64);
		var perUnit = upstream.kgCo2ePerUnit(gwp);
		var counted = converted.multiply(periodShare);
		var kgCo2e = round(counted.multiply(perUnit).multiply(share));
		var gases = gases(upstream, gwp, counted, share);
		var note = new StringBuilder(rule.getKind().phrase()).append(" of ");
		var ref = primary.getRecordRef();
		if (ref != null && !ref.isBlank()) {
			note.append(ref).append(' ');
		}
		note.append(primary.getActivityType() == null ? primary.getFacilityName() : primary.getActivityType());
		// the Scope 3 Standard computes losses from the electricity consumed and is silent on the
		// market-based balance: this inventory prices every consumed kilowatt-hour at the location-based factor
		if (rule.getKind() == UpstreamRuleKind.TRANSMISSION_AND_DISTRIBUTION && market != null
				&& market.instrument() != null) {
			note.append("; on the consumed kWh, not the market-based balance");
		}
		var derived = new GhgRunLine.Derived(primary.getId(), rule.getKind(), note.toString());
		return new GhgRunLine(run, assignment, converted,
				primaryConversionFactor.multiply(ratio, MathContext.DECIMAL64), perUnit, share, period, kgCo2e, gases,
				null, evidenceFiles, null, upstream, ActivityCategory.FUEL_ENERGY_RELATED, derived);
	}

	/** The derived line of a primary, from the figures the primary carried. */
	static GhgRunLine derivedLine(GhgRun run, InventoryAssignment assignment, Primary primary, UpstreamRule rule,
			UnitConverter.Scoped units, GwpSet gwp) {
		return derivedLine(run, assignment, primary.line(), rule, units, gwp, primary.convertedQuantity(),
				primary.conversionFactor(), primary.share(), primary.periodShare(), primary.period(),
				primary.evidenceFiles(), primary.market());
	}

	static String kwh(BigDecimal value) {
		return KWH_FORMAT.format(value);
	}

	static String plain(BigDecimal value) {
		return value.stripTrailingZeros().toPlainString();
	}
}
