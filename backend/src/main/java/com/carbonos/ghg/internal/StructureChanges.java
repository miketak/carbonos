package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * The reasons the organization's history gives for a change to its structure
 * (spec 01.7, 03.1, 03.4): a legal entity, a facility or a source stream added,
 * edited or removed. An edit is described field by field as "field old → new",
 * comparing the record as it stood before the edit with the record after it,
 * so an edit that changes nothing describes nothing and writes no row.
 * Free-text notes are named without their values: the note is on the record,
 * and the reason has a length limit.
 */
final class StructureChanges {

	/** What an absent value reads as. */
	static final String NONE = "none";

	/**
	 * The longest detail kept, leaving room within the 500 characters of the
	 * reason column for the support-access marker.
	 */
	static final int MAX_DETAIL = 470;

	private final Map<String, String> fields = new LinkedHashMap<>();
	private final Set<String> namedOnly = new HashSet<>();

	private StructureChanges() {
	}

	private StructureChanges field(String name, String value) {
		fields.put(name, value == null ? NONE : value);
		return this;
	}

	private StructureChanges note(String name, String value) {
		namedOnly.add(name);
		return field(name, value);
	}

	/**
	 * The fields of a legal entity the history names. Whether the company
	 * controls a franchise is a fact only for a franchise (spec 03.3); for any
	 * other relationship Table 1 settles it, and the relationship says so.
	 */
	static StructureChanges of(LegalEntity entity) {
		var snapshot = new StructureChanges().field("name", entity.getName())
			.field("relationship", relationship(entity.getRelationshipType()))
			.field("economic interest", percent(entity.getEconomicInterestPercent()))
			.field("legal ownership", percent(entity.getLegalOwnershipPercent()))
			.field("operated", yesNo(entity.isOperatedByCompany()));
		if (entity.getRelationshipType() == RelationshipType.FRANCHISE) {
			snapshot.field("financially controlled", yesNo(entity.isControlledByCompany()));
		}
		return snapshot.field("held through", entity.getParent() == null ? "directly" : entity.getParent().getName())
			.field("acquired on", date(entity.getEffectiveFrom()))
			.field("disposed of on", date(entity.getEffectiveTo()))
			.field("jurisdiction", entity.getJurisdiction())
			.field("financial control", controlDecision(entity.getFinancialControlOverride()))
			.note("basis of the decision", entity.getControlNote());
	}

	/** The fields of a facility the history names. */
	static StructureChanges of(Facility facility) {
		return new StructureChanges().field("name", facility.getName())
			.field("legal entity", facility.getEntity().getName())
			.field("location", facility.getLocation())
			.field("country", facility.getCountry())
			.field("grid region", facility.getGridRegion())
			.field("facility type", facility.getFacilityType() == null ? null : words(facility.getFacilityType()))
			.field("lease", facility.getLeaseType() == null ? "owned, not leased" : words(facility.getLeaseType()))
			.field("lease from", date(facility.getLeaseFrom()))
			.field("lease until", date(facility.getLeaseTo()));
	}

	/**
	 * The fields of an emission source the history names (spec 04.3). The kind
	 * and the operator are the source's operational-boundary decision; the note
	 * is named without its value.
	 */
	static StructureChanges of(SourceStream stream) {
		return new StructureChanges().field("name", stream.getName())
			.field("kind", kind(stream.getKind()))
			.field("fuel", stream.getFuel())
			.field("meter or supplier", stream.getMeterOrSupplier())
			.field("operated by", stream.isContractorOperated() ? "a contractor" : "the company")
			.note("note", stream.getNote());
	}

	/**
	 * "Subject: field old → new, field old → new", or null when nothing
	 * changed. A field present on one side only (the franchise control fact
	 * when the relationship changes) is left to the relationship to explain.
	 */
	static String changed(String subject, StructureChanges before, StructureChanges after) {
		return changed(subject, before, after, null);
	}

	/**
	 * As above, then "; reason: the reason typed" when the edit needed one (a
	 * source with records changing its kind or operator, spec 04.3). The whole
	 * sentence is fit to the column, so a long reason is cut, not the fields.
	 */
	static String changed(String subject, StructureChanges before, StructureChanges after, String reason) {
		var changes = new ArrayList<String>();
		for (var entry : after.fields.entrySet()) {
			var name = entry.getKey();
			var was = before.fields.get(name);
			var now = entry.getValue();
			if (was == null || was.equals(now)) {
				continue;
			}
			changes.add(after.namedOnly.contains(name) ? name + " changed" : name + " " + was + " → " + now);
		}
		if (changes.isEmpty()) {
			return null;
		}
		var text = subject + ": " + String.join(", ", changes);
		return fit(reason == null ? text : text + "; reason: " + reason);
	}

	/** "Name added: joint venture, economic interest 60%, legal ownership 60%, held through Parent". */
	static String entityAdded(LegalEntity entity) {
		var parts = new ArrayList<>(List.of(relationship(entity.getRelationshipType()),
				"economic interest " + percent(entity.getEconomicInterestPercent())));
		if (entity.getLegalOwnershipPercent() != null) {
			parts.add("legal ownership " + percent(entity.getLegalOwnershipPercent()));
		}
		if (entity.getParent() != null) {
			parts.add("held through " + entity.getParent().getName());
		}
		return fit(entity.getName() + " added: " + String.join(", ", parts));
	}

	/** "Name added under Entity, location Location". */
	static String facilityAdded(Facility facility) {
		return fit(facility.getName() + " added under " + facility.getEntity().getName() + ", location "
				+ facility.getLocation());
	}

	/** "Name removed: the reason the user typed". */
	static String removed(String name, String reason) {
		return fit(name + " removed: " + reason);
	}

	/** "Stream added at Facility: kind". */
	static String streamAdded(SourceStream stream) {
		return streamAdded(stream, List.of(), null);
	}

	/**
	 * "Stream added at Facility: kind", then "during data entry" for a source born on
	 * the activity form, and "beside 'Near name': the reason" when it was created
	 * next to a similar name with a reason (spec 04.10).
	 */
	static String streamAdded(SourceStream stream, List<SourceStream> similar, String reason) {
		return streamAdded(stream, similar, reason, null);
	}

	/**
	 * As above, and "during import of file (sha256 prefix); rows 4, 9, 17" for a source
	 * born in the import preview (spec 04.11).
	 */
	static String streamAdded(SourceStream stream, List<SourceStream> similar, String reason, String importNote) {
		var text = new StringBuilder(stream.getName()).append(" added at ")
			.append(stream.getFacility().getName())
			.append(": ")
			.append(kind(stream.getKind()));
		if (stream.getOrigin() == SourceStream.Origin.INLINE) {
			text.append(", during data entry");
		}
		else if (stream.getOrigin() == SourceStream.Origin.IMPORT) {
			text.append(", during import").append(importNote == null ? "" : " of " + importNote);
		}
		if (reason != null && !similar.isEmpty()) {
			text.append("; beside ")
				.append(similar.stream().map(s -> "'" + s.getName() + "'").collect(Collectors.joining(", ")))
				.append(": ")
				.append(reason);
		}
		return fit(text.toString());
	}

	/** "'Standby genset 3' in rows 4, 9, 17 of adansi-2025.xlsx mapped to 'Standby gensets'" (spec 04.11). */
	static String importSourceMapped(String typedName, List<Integer> rows, String fileName, SourceStream stream,
			String reason) {
		var text = "'" + typedName + "' in " + rowsText(rows) + " of " + fileName + " mapped to '" + stream.getName() + "'";
		return fit(reason == null ? text : text + ": " + reason);
	}

	/**
	 * One act over several records (spec 04.11): "Emission source 'Standby gensets' assigned to 12
	 * records (ACT-0003, ACT-0004, …): the reason".
	 */
	static String bulkCorrected(GhgService.BulkAction action, String target, List<String> recordRefs, String reason) {
		var count = recordRefs.size() + (recordRefs.size() == 1 ? " record" : " records");
		var head = switch (action) {
			case ASSIGN_SOURCE -> "Emission source '" + target + "' assigned to " + count;
			case SET_TIER -> "Data quality tier " + target + " set on " + count;
			case ADD_EVIDENCE_LINK -> "Evidence link '" + target + "' added to " + count;
			case REMOVE -> count + " removed";
		};
		var listed = recordRefs.stream().limit(10).collect(Collectors.joining(", "))
				+ (recordRefs.size() > 10 ? ", and " + (recordRefs.size() - 10) + " more" : "");
		return fit(head + " (" + listed + "): " + reason);
	}

	/** "rows 4, 9, 17" or "row 4". */
	static String rowsText(List<Integer> rows) {
		return (rows.size() == 1 ? "row " : "rows ") + rows.stream().map(String::valueOf).collect(Collectors.joining(", "));
	}

	/** "Stream removed from Facility". */
	static String streamRemoved(SourceStream stream) {
		return fit(stream.getName() + " removed from " + stream.getFacility().getName());
	}

	/** A detail cut to {@link #MAX_DETAIL} characters, with an ellipsis where it was cut. */
	static String fit(String detail) {
		return detail.length() <= MAX_DETAIL ? detail : detail.substring(0, MAX_DETAIL - 1) + "…";
	}

	/** "60%", "12.5%": the percentage without trailing zeros. */
	static String percent(BigDecimal value) {
		return value == null ? null : value.stripTrailingZeros().toPlainString() + "%";
	}

	private static String date(LocalDate value) {
		return value == null ? null : value.toString();
	}

	private static String yesNo(boolean value) {
		return value ? "yes" : "no";
	}

	private static String controlDecision(Boolean override) {
		if (override == null) {
			return "follows Table 1";
		}
		return override ? "consolidated by decision" : "not controlled by decision";
	}

	private static String relationship(RelationshipType type) {
		return type == RelationshipType.FIXED_ASSET_INVESTMENT ? "fixed-asset investment" : words(type);
	}

	private static String kind(StreamKind kind) {
		return switch (kind) {
			case PURCHASED_HEAT_STEAM_COOLING -> "purchased heat, steam or cooling";
			case TRAVEL -> "business travel";
			case COMMUTING -> "employee commuting";
			case PURCHASED_GOODS -> "purchased goods and services";
			default -> words(kind);
		};
	}

	private static String words(Enum<?> value) {
		return value.name().toLowerCase(Locale.ROOT).replace('_', ' ');
	}
}
