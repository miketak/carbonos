package com.carbonos.ghg.internal;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.carbonos.media.MediaStorage;
import com.carbonos.media.MediaStorageException;

/**
 * Bulk entry of activity records from a CSV file (spec 04.5). The whole file
 * is validated first and nothing is imported while any row is rejected, so a
 * corrected file can be uploaded again without doubling records. A row that
 * repeats a record already on file, or another row of the file, is rejected
 * as a duplicate. A dry run (spec 04.6) returns the same validation with each
 * row's readiness, control totals and warnings, and saves nothing; a real
 * import keeps the file with its digest so every record traces to its row.
 */
@Service
@Transactional
public class ActivityImportService {

	static final int MAX_ROWS = 10_000;
	static final long MAX_BYTES = 5L * 1024 * 1024;

	public static final List<String> COLUMNS = List.of("facility", "stream", "activity_type", "quantity", "unit",
			"period_start", "period_end", "data_source", "evidence_ref", "data_quality", "data_quality_tier",
			"uncertainty_percent", "note");

	public record Rejection(int row, String message) {
	}

	/** A row as it would import (spec 04.6): what a reviewer would see, with its readiness. */
	public record PreviewRow(int row, String facilityName, String streamName, String activityType,
			BigDecimal quantity, String unit, LocalDate periodStart, LocalDate periodEnd, String dataSource,
			String evidenceRef, DataQuality dataQuality, int dataQualityTier, ActivityReadiness readiness) {
	}

	/** Rows and summed quantity per facility, stream and unit: the totals to check against the sheet's footer. */
	public record Total(String facilityName, String streamName, String unit, int rows, BigDecimal quantity) {
	}

	/** Something worth a look before committing, not a reason to reject the row. */
	public record Warning(int row, String message) {
	}

	public record Result(boolean dryRun, UUID batchId, int imported, List<Rejection> rejected, List<PreviewRow> rows,
			List<Total> totals, List<Warning> warnings) {
	}

	private final OrganizationRepository organizations;
	private final FacilityRepository facilities;
	private final SourceStreamRepository streams;
	private final ActivityRecordRepository activities;
	private final ImportBatchRepository batches;
	private final MediaStorage media;
	private final GhgAccess access;

	ActivityImportService(OrganizationRepository organizations, FacilityRepository facilities,
			SourceStreamRepository streams, ActivityRecordRepository activities, ImportBatchRepository batches,
			MediaStorage media, GhgAccess access) {
		this.organizations = organizations;
		this.facilities = facilities;
		this.streams = streams;
		this.activities = activities;
		this.batches = batches;
		this.media = media;
		this.access = access;
	}

	/** The header and one example row, for the download. */
	public static String template() {
		return String.join(",", COLUMNS) + "\r\n"
				+ "Nkran Mine,Standby gensets,Diesel consumption,12500,litre,2025-03-01,2025-03-31,Fuel register,INV-2938,MEASURED,1,2,March dispensing\r\n";
	}

	/** Validates the file and reports what would import; saves nothing (spec 04.6). */
	@Transactional(readOnly = true)
	public Result preview(UUID organizationId, MultipartFile file) {
		var organization = organizations.findById(organizationId)
			.orElseThrow(() -> GhgNotFoundException.organization(organizationId));
		access.checkWrite(organization);
		var parsed = parse(organizationId, read(file));
		return new Result(true, null, 0, parsed.rejected(), parsed.rows(), parsed.totals(), parsed.warnings());
	}

	public Result importFile(UUID organizationId, MultipartFile file) {
		// row-locked: the records take a block of numbers from the organization's counter (spec 04.6)
		var organization = organizations.lockById(organizationId)
			.orElseThrow(() -> GhgNotFoundException.organization(organizationId));
		access.checkWrite(organization);
		var bytes = read(file);
		var parsed = parse(organizationId, bytes);
		if (!parsed.rejected().isEmpty()) {
			return new Result(false, null, 0, parsed.rejected(), List.of(), parsed.totals(), parsed.warnings());
		}
		var fileName = file.getOriginalFilename() == null || file.getOriginalFilename().isBlank() ? "import.csv"
				: file.getOriginalFilename().replaceAll("[\\\\/]", "_");
		var batch = batches.save(new ImportBatch(organizationId, fileName, sha256(bytes), parsed.accepted().size(),
				bytes.length, access.currentUserEmail()));
		var first = organization.allocateRecordNumbers(parsed.accepted().size());
		var records = new ArrayList<ActivityRecord>(parsed.accepted().size());
		for (var i = 0; i < parsed.accepted().size(); i++) {
			var accepted = parsed.accepted().get(i);
			var record = new ActivityRecord(first + i, false, accepted.facility(), accepted.stream(),
					accepted.activityType(), accepted.quantity(), accepted.unit(), accepted.periodStart(),
					accepted.periodEnd(), accepted.dataSource(), accepted.evidenceRef(), accepted.dataQuality(),
					accepted.note(), accepted.dataQualityTier(), accepted.uncertaintyPercent());
			record.fromImport(batch.getId(), accepted.row());
			records.add(record);
		}
		activities.saveAll(records);
		// the file is kept after the rows are fixed: a failed put rolls the import back (ISO 14064-1 section 8.3)
		media.put(batch.getStorageKey(), new ByteArrayInputStream(bytes), bytes.length, "text/csv");
		return new Result(false, batch.getId(), records.size(), List.of(), List.of(), parsed.totals(),
				parsed.warnings());
	}

	/** A row that passed validation, before it is numbered and saved. */
	private record Accepted(int row, Facility facility, SourceStream stream, String activityType,
			BigDecimal quantity, String unit, LocalDate periodStart, LocalDate periodEnd, String dataSource,
			String evidenceRef, DataQuality dataQuality, String note, Integer dataQualityTier,
			BigDecimal uncertaintyPercent) {
	}

	private record Parsed(List<Rejection> rejected, List<Accepted> accepted, List<PreviewRow> rows,
			List<Total> totals, List<Warning> warnings) {
	}

	private static byte[] read(MultipartFile file) {
		if (file.isEmpty()) {
			throw new GhgFieldException("file", "Choose a CSV file to import.");
		}
		if (file.getSize() > MAX_BYTES) {
			throw new GhgFieldException("file", "The file is larger than 5 MB.");
		}
		try {
			return file.getBytes();
		}
		catch (IOException ex) {
			throw new MediaStorageException("Failed to read the uploaded file", ex);
		}
	}

	private static String sha256(byte[] bytes) {
		try {
			return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("SHA-256 is not available", ex);
		}
	}

	private Parsed parse(UUID organizationId, byte[] bytes) {
		var table = CsvTable.parse(new String(bytes, StandardCharsets.UTF_8));
		if (table.header().isEmpty()) {
			throw new GhgFieldException("file", "The file is empty. Download the template and fill it in.");
		}
		for (var required : List.of("facility", "activity_type", "quantity", "unit", "period_start")) {
			if (!table.header().contains(required)) {
				throw new GhgFieldException("file", "The header lacks the '" + required + "' column. Download the template.");
			}
		}
		if (table.rows().size() > MAX_ROWS) {
			throw new GhgFieldException("file", "The file has more than " + MAX_ROWS + " rows. Split it.");
		}
		var facilitiesByName = facilities.findAllByOrganizationIdAndDeletedAtIsNullOrderByCreatedAtAsc(organizationId)
			.stream()
			.collect(Collectors.toMap(f -> f.getName().toLowerCase(Locale.ROOT), Function.identity(), (a, b) -> a));
		var streamsByFacility = new HashMap<UUID, Map<String, SourceStream>>();
		for (var stream : streams.findAllByFacilityOrganizationIdOrderByNameAsc(organizationId)) {
			streamsByFacility.computeIfAbsent(stream.getFacility().getId(), k -> new HashMap<>())
				.put(stream.getName().toLowerCase(Locale.ROOT), stream);
		}
		// facts only: a draft is a stub, not something a row could duplicate (spec 04.6)
		var existing = activities.findAllByOrganizationIdAndDeletedAtIsNullAndDraftFalseOrderByPeriodEndDesc(organizationId)
			.stream()
			.map(a -> key(a.getFacility().getId(), a.getActivityType(), a.getQuantity(), a.getUnit(), a.getPeriodStart(),
					a.getPeriodEnd()))
			.collect(Collectors.toCollection(HashSet::new));
		// a draft the row may be completing: same facility, activity and period (spec 04.6)
		var drafts = new HashMap<String, ActivityRecord>();
		for (var draft : activities
			.findAllByOrganizationIdAndDeletedAtIsNullAndDraftTrueOrderByCreatedAtAsc(organizationId)) {
			drafts.put(draft.getFacility().getId() + "|" + draft.getActivityType().trim().toLowerCase(Locale.ROOT) + "|"
					+ draft.getPeriodStart() + "|" + draft.getPeriodEnd(), draft);
		}
		var rejected = new ArrayList<Rejection>();
		var accepted = new ArrayList<Accepted>();
		var previews = new ArrayList<PreviewRow>();
		var warnings = new ArrayList<Warning>();
		var totals = new LinkedHashMap<String, Total>();
		var unitsByStream = new HashMap<String, java.util.Set<String>>();
		var today = LocalDate.now();
		for (var row : table.rows()) {
			var cells = new Cells(table.header(), row.cells());
			var problems = new ArrayList<String>();
			var facility = facilitiesByName.get(cells.get("facility").toLowerCase(Locale.ROOT));
			if (cells.get("facility").isBlank()) {
				problems.add("facility is empty");
			}
			else if (facility == null) {
				problems.add("no facility named '" + cells.get("facility") + "'");
			}
			SourceStream stream = null;
			if (!cells.get("stream").isBlank() && facility != null) {
				stream = streamsByFacility.getOrDefault(facility.getId(), Map.of())
					.get(cells.get("stream").toLowerCase(Locale.ROOT));
				if (stream == null) {
					problems.add("'" + facility.getName() + "' has no stream named '" + cells.get("stream") + "'");
				}
			}
			var activityType = cells.get("activity_type");
			if (activityType.isBlank()) {
				problems.add("activity_type is empty");
			}
			else if (activityType.length() > 120) {
				problems.add("activity_type is longer than 120 characters");
			}
			BigDecimal quantity = null;
			try {
				quantity = new BigDecimal(cells.get("quantity").replace(",", ""));
				if (quantity.signum() <= 0) {
					problems.add("quantity must be greater than 0");
				}
				else if (quantity.scale() > 3 || quantity.precision() - quantity.scale() > 11) {
					problems.add("quantity has more than 3 decimals or more than 11 integer digits");
				}
			}
			catch (NumberFormatException ex) {
				problems.add("quantity '" + cells.get("quantity") + "' is not a number");
			}
			var unit = cells.get("unit");
			if (unit.isBlank()) {
				problems.add("unit is empty");
			}
			else if (unit.length() > 30) {
				problems.add("unit is longer than 30 characters");
			}
			var start = date(cells.get("period_start"), "period_start", problems);
			var end = cells.get("period_end").isBlank() ? start : date(cells.get("period_end"), "period_end", problems);
			if (start != null && start.isAfter(today)) {
				problems.add("period_start is in the future");
			}
			if (end != null && end.isAfter(today)) {
				problems.add("period_end is in the future");
			}
			if (start != null && end != null && end.isBefore(start)) {
				problems.add("period_end is before period_start");
			}
			DataQuality quality = DataQuality.MEASURED;
			if (!cells.get("data_quality").isBlank()) {
				try {
					quality = DataQuality.valueOf(cells.get("data_quality").trim().toUpperCase(Locale.ROOT));
				}
				catch (IllegalArgumentException ex) {
					problems.add("data_quality must be MEASURED, ESTIMATED or CALCULATED");
				}
			}
			Integer tier = null;
			if (!cells.get("data_quality_tier").isBlank()) {
				try {
					tier = Integer.parseInt(cells.get("data_quality_tier").trim());
					if (tier < 1 || tier > 5) {
						problems.add("data_quality_tier must be 1 to 5");
					}
				}
				catch (NumberFormatException ex) {
					problems.add("data_quality_tier must be 1 to 5");
				}
			}
			BigDecimal uncertainty = null;
			if (!cells.get("uncertainty_percent").isBlank()) {
				try {
					uncertainty = new BigDecimal(cells.get("uncertainty_percent").trim());
					if (uncertainty.signum() < 0) {
						problems.add("uncertainty_percent must be 0 or more");
					}
				}
				catch (NumberFormatException ex) {
					problems.add("uncertainty_percent is not a number");
				}
			}
			for (var field : List.of("data_source", "evidence_ref", "note")) {
				var limit = field.equals("data_source") ? 120 : field.equals("evidence_ref") ? 150 : 255;
				if (cells.get(field).length() > limit) {
					problems.add(field + " is longer than " + limit + " characters");
				}
			}
			if (problems.isEmpty() && facility != null) {
				var k = key(facility.getId(), activityType, quantity, unit, start, end);
				if (!existing.add(k)) {
					problems.add("duplicate: the same facility, activity, quantity, unit and period already exist on file or earlier in this file");
				}
			}
			if (!problems.isEmpty()) {
				rejected.add(new Rejection(row.number(), String.join("; ", problems)));
				continue;
			}
			var item = new Accepted(row.number(), facility, stream, activityType.trim(), quantity, unit.trim(), start,
					end, blankToNull(cells.get("data_source")), blankToNull(cells.get("evidence_ref")), quality,
					blankToNull(cells.get("note")), tier, uncertainty);
			accepted.add(item);
			var record = new ActivityRecord(0, false, facility, stream, item.activityType(), quantity, item.unit(),
					start, end, item.dataSource(), item.evidenceRef(), quality, item.note(), tier, uncertainty);
			previews.add(new PreviewRow(row.number(), facility.getName(), stream == null ? null : stream.getName(),
					item.activityType(), quantity, item.unit(), start, end, item.dataSource(), item.evidenceRef(),
					quality, record.getDataQualityTier(), ActivityReadiness.of(record, false)));
			var totalKey = facility.getId() + "|" + (stream == null ? "" : stream.getId()) + "|"
					+ item.unit().toLowerCase(Locale.ROOT);
			totals.merge(totalKey,
					new Total(facility.getName(), stream == null ? null : stream.getName(), item.unit(), 1, quantity),
					(a, b) -> new Total(a.facilityName(), a.streamName(), a.unit(), a.rows() + b.rows(),
							a.quantity().add(b.quantity())));
			var draft = drafts.get(facility.getId() + "|" + item.activityType().toLowerCase(Locale.ROOT) + "|" + start
					+ "|" + end);
			if (draft != null) {
				warnings.add(new Warning(row.number(), "matches draft " + draft.getRecordRef()
						+ " (same facility, activity and period): the draft stays on file, complete or remove it"));
			}
			if (stream != null) {
				var seen = unitsByStream.computeIfAbsent(stream.getId().toString(), k -> new java.util.TreeSet<>());
				seen.add(item.unit().toLowerCase(Locale.ROOT));
				if (seen.size() > 1) {
					warnings.add(new Warning(row.number(), "'" + stream.getName() + "' mixes units in this file: "
							+ String.join(", ", seen)));
				}
			}
			if (start.plusMonths(1).isBefore(end.plusDays(1))) {
				warnings.add(new Warning(row.number(), "the period is longer than one month (" + start + " to " + end
						+ "); monthly rows make the coverage matrix and cut-off checks precise"));
			}
		}
		return new Parsed(List.copyOf(rejected), List.copyOf(accepted), List.copyOf(previews),
				List.copyOf(totals.values()), List.copyOf(warnings));
	}

	private static LocalDate date(String value, String field, List<String> problems) {
		if (value.isBlank()) {
			problems.add(field + " is empty");
			return null;
		}
		try {
			return LocalDate.parse(value.trim());
		}
		catch (DateTimeParseException ex) {
			problems.add(field + " '" + value + "' is not a date (use 2025-03-31)");
			return null;
		}
	}

	private static String key(UUID facilityId, String type, BigDecimal quantity, String unit, LocalDate start,
			LocalDate end) {
		return facilityId + "|" + type.trim().toLowerCase(Locale.ROOT) + "|"
				+ (quantity == null ? "" : quantity.stripTrailingZeros().toPlainString()) + "|"
				+ unit.trim().toLowerCase(Locale.ROOT) + "|" + start + "|" + end;
	}

	private static String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}

	/** The cells of a row by header name; a missing column reads as empty. */
	private record Cells(List<String> header, List<String> values) {
		String get(String column) {
			var index = header.indexOf(column);
			return index < 0 || index >= values.size() ? "" : values.get(index).trim();
		}
	}
}
