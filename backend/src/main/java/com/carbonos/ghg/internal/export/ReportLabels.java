package com.carbonos.ghg.internal.export;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.AssuranceLevel;
import com.carbonos.ghg.internal.ConsolidationApproach;
import com.carbonos.ghg.internal.DataQuality;
import com.carbonos.ghg.internal.ExclusionReason;
import com.carbonos.ghg.internal.GwpSet;
import com.carbonos.ghg.internal.InventoryStatus;
import com.carbonos.ghg.internal.LeaseType;
import com.carbonos.ghg.internal.MarketInstrument;
import com.carbonos.ghg.internal.RecalculationStatus;
import com.carbonos.ghg.internal.RecalculationTrigger;
import com.carbonos.ghg.internal.RelationshipType;
import com.carbonos.ghg.internal.Scope;
import com.carbonos.ghg.internal.Scope2Criterion;
import com.carbonos.ghg.internal.Scope2MarketBasis;
import com.carbonos.ghg.internal.StreamKind;
import com.carbonos.ghg.internal.StructuralChangeConvention;

/**
 * The words the PDF prints for every enum the report carries, and the date
 * forms a reader expects (spec 07.8). The labels are those of the report page:
 * {@code frontend/src/features/ghg/format.ts} and {@code assuranceLabels} in
 * {@code ReportMetadataCard.tsx} say the same thing, so the page and the PDF
 * agree; a change here is a change there. Each switch is exhaustive, so a new
 * constant without a label fails to compile, and {@code ReportLabelsTest}
 * checks that no label is the constant's own name.
 */
public final class ReportLabels {

	private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.ENGLISH);
	private static final DateTimeFormatter INSTANT = DateTimeFormatter.ofPattern("d MMMM yyyy, HH:mm 'UTC'", Locale.ENGLISH)
		.withZone(ZoneOffset.UTC);

	/** Every enum the dictionary covers, for the completeness test. */
	static final List<Class<? extends Enum<?>>> COVERED = List.of(ConsolidationApproach.class, Scope.class,
			ActivityCategory.class, Scope2MarketBasis.class, MarketInstrument.class, AssuranceLevel.class,
			ExclusionReason.class, DataQuality.class, LeaseType.class, StreamKind.class, InventoryStatus.class,
			GwpSet.class, StructuralChangeConvention.class, RecalculationStatus.class, RecalculationTrigger.class,
			Scope2Criterion.class, Scope2Criterion.Answer.class, RelationshipType.class);

	private ReportLabels() {
	}

	/** The reader's word for a constant; never its name. */
	public static String label(Enum<?> value) {
		return switch (value) {
			case ConsolidationApproach approach -> switch (approach) {
				case EQUITY_SHARE -> "Equity share";
				case FINANCIAL_CONTROL -> "Financial control";
				case OPERATIONAL_CONTROL -> "Operational control";
			};
			case Scope scope -> switch (scope) {
				case SCOPE_1 -> "Scope 1";
				case SCOPE_2 -> "Scope 2";
				case SCOPE_3 -> "Scope 3";
			};
			case ActivityCategory category -> category(category);
			case Scope2MarketBasis basis -> switch (basis) {
				case INSTRUMENTS -> "contractual instruments applied to the kWh they cover; the balance at the residual mix or grid average";
				case RESIDUAL_MIX -> "no instrument applied; every kWh at the residual mix";
				case GRID_AVERAGE -> "no instrument applied and no residual mix available; the grid average (location-based) stands in";
			};
			case MarketInstrument instrument -> switch (instrument) {
				case SUPPLIER_SPECIFIC -> "Supplier-specific factor";
				case CONTRACT -> "Power purchase contract";
				case CERTIFICATE -> "Energy attribute certificate";
				case RESIDUAL_MIX -> "Residual mix";
			};
			case AssuranceLevel assurance -> switch (assurance) {
				case UNVERIFIED -> "Not verified";
				case LIMITED -> "Limited assurance";
				case REASONABLE -> "Reasonable assurance";
			};
			case ExclusionReason reason -> switch (reason) {
				case OUTSIDE_PERIOD -> "Outside reporting period";
				case OUTSIDE_BOUNDARY -> "Outside boundary";
				case NON_GHG -> "Non-GHG activity";
				case DUPLICATE -> "Duplicate";
				case NOT_APPLICABLE -> "Not applicable";
				case METHODOLOGY -> "Methodology exclusion";
				case OTHER -> "Other documented reason";
				case RECORD_REMOVED -> "Record removed";
			};
			case DataQuality quality -> switch (quality) {
				case MEASURED -> "Measured";
				case ESTIMATED -> "Estimated";
				case CALCULATED -> "Calculated";
			};
			case LeaseType lease -> switch (lease) {
				case FINANCE_LEASE_IN -> "Finance lease (leased in)";
				case OPERATING_LEASE_IN -> "Operating lease (leased in)";
				case FINANCE_LEASE_OUT -> "Finance lease (leased out)";
				case OPERATING_LEASE_OUT -> "Operating lease (leased out)";
			};
			case StreamKind kind -> switch (kind) {
				case STATIONARY_COMBUSTION -> "Stationary combustion";
				case MOBILE_COMBUSTION -> "Mobile combustion";
				case PROCESS -> "Process";
				case FUGITIVE -> "Fugitive";
				case PURCHASED_ELECTRICITY -> "Purchased electricity";
				case PURCHASED_HEAT_STEAM_COOLING -> "Purchased heat, steam or cooling";
				case WASTE -> "Waste";
				case TRANSPORT -> "Transport";
				case TRAVEL -> "Business travel";
				case COMMUTING -> "Employee commuting";
				case PURCHASED_GOODS -> "Purchased goods and services";
				case OTHER -> "Other";
			};
			case InventoryStatus status -> switch (status) {
				case DRAFT -> "Draft";
				case FROZEN -> "Frozen";
				case FINAL -> "Final";
				case PUBLISHED -> "Published";
			};
			case GwpSet gwp -> switch (gwp) {
				case AR5 -> "IPCC AR5";
				case AR6 -> "IPCC AR6";
			};
			case StructuralChangeConvention convention -> switch (convention) {
				case TRANSACTION_DATE -> "From the transaction date (membership windows)";
				case WHOLE_YEAR -> "For the whole year, as the Standard recommends";
			};
			case RecalculationStatus status -> switch (status) {
				case FLAGGED -> "Flagged";
				case RECALCULATED -> "Recalculated";
				case DECLINED -> "Declined";
			};
			case RecalculationTrigger trigger -> switch (trigger) {
				case STRUCTURAL_CHANGE -> "Structural change";
				case METHODOLOGY_CHANGE -> "Methodology change";
				case ERROR_CORRECTION -> "Significant error corrected";
			};
			case Scope2Criterion criterion -> switch (criterion) {
				case CONVEYS_ATTRIBUTE -> "Conveys the attribute";
				case UNIQUE_CLAIM -> "Unique claim";
				case RETIRED_FOR_COMPANY -> "Retired for the company";
				case VINTAGE_MATCHES -> "Vintage matches";
				case SAME_MARKET -> "Same market";
				case SUPPLIER_FACTOR_NET -> "Supplier factor net of certificates";
				case RESIDUAL_MIX_FOR_BALANCE -> "Residual mix for the balance";
				case DOCUMENTED -> "Documented";
			};
			case Scope2Criterion.Answer answer -> switch (answer) {
				case MET -> "met";
				case NOT_MET -> "not met";
				case UNANSWERED -> "unanswered";
			};
			case RelationshipType relationship -> switch (relationship) {
				case SUBSIDIARY -> "Group company or subsidiary (financial control)";
				case JOINT_VENTURE -> "Joint venture, partnership or operation (joint financial control)";
				case ASSOCIATE -> "Associate or affiliate (significant influence, no control)";
				case FIXED_ASSET_INVESTMENT -> "Fixed-asset investment (no significant influence)";
				case FRANCHISE -> "Franchise (consolidated only with equity rights or control)";
			};
			default -> throw new IllegalArgumentException("No report label for " + value.getDeclaringClass().getSimpleName()
					+ "." + value.name());
		};
	}

	/** The label in the middle of a sentence: "operational control approach". */
	public static String lower(Enum<?> value) {
		var label = label(value);
		return Character.toLowerCase(label.charAt(0)) + label.substring(1);
	}

	/** Several constants as a comma-separated sentence fragment, never as {@code [A, B]}. */
	public static String list(Collection<? extends Enum<?>> values) {
		return values.stream().map(ReportLabels::label).collect(Collectors.joining(", "));
	}

	/** A Quality Criteria code as the report carries it (a string on the instrument's criterion row). */
	public static String criterion(String code) {
		try {
			return label(Scope2Criterion.valueOf(code));
		}
		catch (IllegalArgumentException ex) {
			return code.toLowerCase(Locale.ROOT).replace('_', ' ');
		}
	}

	/** A scope 3 category with its number, so the reader can find it in the Scope 3 Standard. */
	private static String category(ActivityCategory category) {
		return switch (category) {
			case STATIONARY_COMBUSTION -> "Stationary combustion";
			case MOBILE_COMBUSTION -> "Mobile combustion";
			case PROCESS_EMISSIONS -> "Process emissions";
			case FUGITIVE_EMISSIONS -> "Fugitive emissions";
			case PURCHASED_ELECTRICITY -> "Purchased electricity";
			case PURCHASED_HEAT_STEAM -> "Purchased heat and steam";
			case PURCHASED_COOLING -> "Purchased cooling";
			case PURCHASED_GOODS_SERVICES -> "1. Purchased goods and services";
			case CAPITAL_GOODS -> "2. Capital goods";
			case FUEL_ENERGY_RELATED -> "3. Fuel- and energy-related activities";
			case UPSTREAM_TRANSPORT -> "4. Upstream transportation and distribution";
			case WASTE_GENERATED -> "5. Waste generated in operations";
			case BUSINESS_TRAVEL -> "6. Business travel";
			case EMPLOYEE_COMMUTING -> "7. Employee commuting";
			case UPSTREAM_LEASED_ASSETS -> "8. Upstream leased assets";
			case DOWNSTREAM_TRANSPORT -> "9. Downstream transportation and distribution";
			case PROCESSING_SOLD_PRODUCTS -> "10. Processing of sold products";
			case USE_SOLD_PRODUCTS -> "11. Use of sold products";
			case END_OF_LIFE_SOLD_PRODUCTS -> "12. End-of-life treatment of sold products";
			case DOWNSTREAM_LEASED_ASSETS -> "13. Downstream leased assets";
			case FRANCHISES -> "14. Franchises";
			case INVESTMENTS -> "15. Investments";
		};
	}

	/** "15 December 2025". */
	public static String date(LocalDate date) {
		return date == null ? "" : DATE.format(date);
	}

	/** "1 January 2025 to 31 December 2025", or the one day when start and end coincide. */
	public static String period(LocalDate start, LocalDate end) {
		if (start == null || end == null) {
			return date(start != null ? start : end);
		}
		return start.equals(end) ? date(start) : date(start) + " to " + date(end);
	}

	/** "12 September 2026, 05:38 UTC": the PDF has no viewer's zone, so it prints UTC and says so. */
	public static String instant(Instant instant) {
		return instant == null ? "" : INSTANT.format(instant);
	}
}
