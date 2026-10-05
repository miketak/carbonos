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
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.carbonos.ghg.GhgRules;
import com.carbonos.media.MediaStorage;
import com.carbonos.media.MediaStorageException;

/**
 * Bulk entry of activity records from a CSV file or a workbook (specs 04.5,
 * 04.11). The whole file is validated first and nothing is imported while any
 * row is rejected, so a corrected file can be uploaded again without doubling
 * records. A row that repeats a record already on file, or another row of the
 * file, is rejected as a duplicate. A dry run (spec 04.6) returns the same
 * validation with each row's readiness, control totals and warnings, and saves
 * nothing; a real import keeps the file with its digest so every record traces
 * to its row. An emission source the facility does not have is decided in the
 * preview (spec 04.11): mapped to an existing source or created with the
 * records, under the reconcile rules of spec 04.10, and every decision is kept
 * on the batch.
 */
@Service
@Transactional
public class ActivityImportService {

	static final int MAX_ROWS = 10_000;
	static final long MAX_BYTES = 5L * 1024 * 1024;

	public static final List<String> COLUMNS = List.of("facility", "emission_source", "activity_type", "quantity", "unit",
			"period_start", "period_end", "data_source", "supplier", "evidence_ref", "data_quality", "data_quality_tier",
			"uncertainty_percent", "note");

	/** The columns whose cells, when formulas, are worth a second look (spec 04.11). */
	private static final List<String> FIGURE_COLUMNS = List.of("quantity", "unit", "period_start", "period_end");

	public record Rejection(int row, String message) {
	}

	/** A row as it would import (spec 04.6): what a reviewer would see, with its readiness. */
	public record PreviewRow(int row, String facilityName, String streamName, String activityType,
			BigDecimal quantity, String unit, LocalDate periodStart, LocalDate periodEnd, String dataSource,
			String evidenceRef, DataQuality dataQuality, int dataQualityTier, ActivityReadiness readiness,
			boolean needsDecision) {
	}

	/** Rows and summed quantity per facility, stream and unit: the totals to check against the sheet's footer. */
	public record Total(String facilityName, String streamName, String unit, int rows, BigDecimal quantity) {
	}

	/** Something worth a look before committing, not a reason to reject the row; row is null for the file itself. */
	public record Warning(Integer row, String message) {
	}

	/** An emission source name the file has and the facility does not, with the rows it covers and the near names. */
	public record UnknownSource(UUID facilityId, String facilityName, String name, List<Integer> rows,
			List<SourceStream> candidates) {
	}

	/** One decision on an unknown name (spec 04.11): map it to a source of the facility, or create one. */
	public record Decision(UUID facilityId, String name, UUID mapTo, GhgService.StreamFacts create, String reason) {
	}

	public record Decisions(String sha256, List<Decision> items) {
	}

	public record Result(boolean dryRun, UUID batchId, int imported, List<Rejection> rejected, List<PreviewRow> rows,
			List<Total> totals, List<Warning> warnings, String sha256, List<UnknownSource> unknownSources,
			int sourcesCreated) {
	}

	private final OrganizationRepository organizations;
	private final FacilityRepository facilities;
	private final SourceStreamRepository streams;
	private final ActivityRecordRepository activities;
	private final ImportBatchRepository batches;
	private final ImportDecisionRepository decisions;
	private final GhgService ghg;
	private final MediaStorage media;
	private final GhgAccess access;

	ActivityImportService(OrganizationRepository organizations, FacilityRepository facilities,
			SourceStreamRepository streams, ActivityRecordRepository activities, ImportBatchRepository batches,
			ImportDecisionRepository decisions, GhgService ghg, MediaStorage media, GhgAccess access) {
		this.organizations = organizations;
		this.facilities = facilities;
		this.streams = streams;
		this.activities = activities;
		this.batches = batches;
		this.decisions = decisions;
		this.ghg = ghg;
		this.media = media;
		this.access = access;
	}

	/** The header and one example row, for the download. */
	public static String template() {
		return String.join(",", COLUMNS) + "\r\n"
				+ "Nkran Mine,Standby gensets,Diesel consumption,12500,litre,2025-03-01,2025-03-31,Fuel register,GOIL Obuasi depot,INV-2938,MEASURED,1,2,March dispensing\r\n";
	}

	/**
	 * The monthly meter-read template (spec 04.12): one row per emission source of
	 * the facility with the period filled and the figures blank. Data quality stays
	 * blank on purpose: a zero typed from memory is an estimate, not a measurement.
	 */
	/** A template file: its name and its text. */
	public record TemplateFile(String fileName, String body) {
	}

	/** The monthly template for a facility the caller may read; the month reads as 2025-09 (spec 04.12). */
	@Transactional(readOnly = true)
	public TemplateFile monthlyTemplate(UUID facilityId, String month) {
		if (facilityId == null) {
			throw new GhgFieldException("facilityId", "Choose the facility the template is for.");
		}
		java.time.YearMonth parsed;
		try {
			parsed = java.time.YearMonth.parse(month == null ? "" : month.trim());
		}
		catch (java.time.format.DateTimeParseException ex) {
			throw new GhgFieldException("month", "Give the month as 2025-09.");
		}
		var facility = facilities.findById(facilityId)
			.filter(found -> !found.isDeleted())
			.orElseThrow(() -> GhgNotFoundException.facility(facilityId));
		access.check(facility.getOrganization());
		var slug = facility.getName().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
		return new TemplateFile("activity-" + slug + "-" + parsed + ".csv",
				monthlyTemplate(facility.getName(), streams.findAllByFacilityIdOrderByNameAsc(facilityId), parsed));
	}

	static String monthlyTemplate(String facilityName, List<SourceStream> sources, java.time.YearMonth month) {
		var records = new ArrayList<List<String>>();
		records.add(COLUMNS);
		for (var source : sources) {
			records.add(List.of(facilityName, source.getName(), source.getName(), "", "", month.atDay(1).toString(),
					month.atEndOfMonth().toString(), "", "", "", "", "", "", ""));
		}
		return CsvTable.render(records);
	}

	/** Validates the file and reports what would import; saves nothing (spec 04.6). */
	@Transactional(readOnly = true)
	public Result preview(UUID organizationId, MultipartFile file, Decisions decided) {
		var organization = organizations.findById(organizationId)
			.orElseThrow(() -> GhgNotFoundException.organization(organizationId));
		access.checkWrite(organization);
		var source = Source.read(file);
		checkDigest(decided, source.sha256());
		var parsed = parse(organization, source, decided, true);
		return new Result(true, null, 0, parsed.rejected(), parsed.rows(), parsed.totals(), parsed.warnings(),
				source.sha256(), parsed.unknown(), 0);
	}

	public Result importFile(UUID organizationId, MultipartFile file, Decisions decided) {
		// row-locked: the records take a block of numbers from the organization's counter (spec 04.6)
		var organization = organizations.lockById(organizationId)
			.orElseThrow(() -> GhgNotFoundException.organization(organizationId));
		access.checkWrite(organization);
		var source = Source.read(file);
		checkDigest(decided, source.sha256());
		var parsed = parse(organization, source, decided, false);
		if (!parsed.rejected().isEmpty()) {
			return new Result(false, null, 0, parsed.rejected(), List.of(), parsed.totals(), parsed.warnings(),
					source.sha256(), List.of(), 0);
		}
		var created = (int) parsed.decided().stream().filter(d -> d.kind() == ImportDecision.Kind.CREATED).count();
		var batch = batches.save(new ImportBatch(organizationId, source.fileName(), source.sha256(),
				parsed.accepted().size(), source.bytes().length, access.currentUserEmail(), source.parser(),
				source.rendered() != null, created));
		var first = organization.allocateRecordNumbers(parsed.accepted().size());
		var records = new ArrayList<ActivityRecord>(parsed.accepted().size());
		for (var i = 0; i < parsed.accepted().size(); i++) {
			var accepted = parsed.accepted().get(i);
			var record = new ActivityRecord(first + i, false, accepted.facility(), accepted.stream(),
					accepted.activityType(), accepted.quantity(), accepted.unit(), accepted.periodStart(),
					accepted.periodEnd(), accepted.dataSource(), accepted.supplier(), accepted.evidenceRef(), accepted.dataQuality(),
					accepted.note(), accepted.dataQualityTier(), accepted.uncertaintyPercent());
			record.fromImport(batch.getId(), accepted.row());
			records.add(record);
		}
		activities.saveAll(records);
		// each decision is kept with the batch, and a mapping gets its own history row (spec 04.11)
		for (var made : parsed.decided()) {
			decisions.save(new ImportDecision(batch.getId(), made.unknown().facilityId(), made.unknown().name(),
					made.kind(), made.stream().getId(), made.unknown().rows(), made.reason(), access.currentUserId(),
					access.currentUserEmail()));
			if (made.kind() == ImportDecision.Kind.MAPPED) {
				ghg.recordImportSourceMapped(organization, StructureChanges.importSourceMapped(made.unknown().name(),
						made.unknown().rows(), source.fileName(), made.stream(), made.reason()));
			}
		}
		// the file is kept after the rows are fixed: a failed put rolls the import back (ISO 14064-1 section 8.3)
		media.put(batch.getStorageKey(), new ByteArrayInputStream(source.bytes()), source.bytes().length,
				source.contentType());
		if (source.rendered() != null) {
			var rendered = source.rendered().getBytes(StandardCharsets.UTF_8);
			media.put(batch.getRenderedStorageKey(), new ByteArrayInputStream(rendered), rendered.length, "text/csv");
		}
		return new Result(false, batch.getId(), records.size(), List.of(), List.of(), parsed.totals(),
				parsed.warnings(), source.sha256(), List.of(), created);
	}

	/** The decisions were made on the previewed file; a different file refuses them (spec 04.11). */
	private static void checkDigest(Decisions decided, String sha256) {
		if (decided == null || decided.items() == null || decided.items().isEmpty()) {
			return;
		}
		if (decided.sha256() == null || !decided.sha256().equalsIgnoreCase(sha256)) {
			throw new GhgRuleViolationException(GhgRules.IMPORT_DECISION_UNUSED);
		}
	}

	/** The file as uploaded and as read: its table, digest, which reader, and the rendering kept for a workbook. */
	private record Source(byte[] bytes, String fileName, String sha256, String contentType, String parser,
			CsvTable table, String rendered, List<Warning> warnings, Map<Integer, Set<String>> formulaCells) {

		static Source read(MultipartFile file) {
			if (file.isEmpty()) {
				throw new GhgFieldException("file", "Choose a CSV or XLSX file to import.");
			}
			if (file.getSize() > MAX_BYTES) {
				throw new GhgFieldException("file", "The file is larger than 5 MB.");
			}
			byte[] bytes;
			try {
				bytes = file.getBytes();
			}
			catch (IOException ex) {
				throw new MediaStorageException("Failed to read the uploaded file", ex);
			}
			var digest = ActivityImportService.sha256(bytes);
			if (XlsxTable.isWorkbook(bytes)) {
				var read = XlsxTable.read(bytes, MAX_ROWS);
				var warnings = new ArrayList<Warning>();
				if (read.sheetCount() > 1) {
					warnings.add(new Warning(null, "The workbook has " + read.sheetCount() + " sheets; only '"
							+ read.sheetName() + "' was read."));
				}
				return new Source(bytes, fileName(file, "import.xlsx"), digest,
						"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", XlsxTable.PARSER,
						read.table(), read.rendered(), warnings, read.formulaCells());
			}
			return new Source(bytes, fileName(file, "import.csv"), digest, "text/csv", "csv",
					CsvTable.parse(new String(bytes, StandardCharsets.UTF_8)), null, List.of(), Map.of());
		}

		private static String fileName(MultipartFile file, String fallback) {
			return file.getOriginalFilename() == null || file.getOriginalFilename().isBlank() ? fallback
					: file.getOriginalFilename().replaceAll("[\\\\/]", "_");
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

	/** A row that passed validation, before it is numbered and saved. */
	private record Accepted(int row, Facility facility, SourceStream stream, String activityType,
			BigDecimal quantity, String unit, LocalDate periodStart, LocalDate periodEnd, String dataSource,
			String supplier, String evidenceRef, DataQuality dataQuality, String note, Integer dataQualityTier,
			BigDecimal uncertaintyPercent) {
	}

	/** A decision resolved against the file: the unknown name, what it became, and the source (saved or transient). */
	private record Made(UnknownSource unknown, ImportDecision.Kind kind, SourceStream stream, String reason) {
	}

	private record Parsed(List<Rejection> rejected, List<Accepted> accepted, List<PreviewRow> rows,
			List<Total> totals, List<Warning> warnings, List<UnknownSource> unknown, List<Made> decided) {
	}

	private static String unknownKey(UUID facilityId, String name) {
		return facilityId + "|" + name.trim().toLowerCase(Locale.ROOT);
	}

	private Parsed parse(Organization organization, Source source, Decisions decided, boolean dryRun) {
		var organizationId = organization.getId();
		var table = source.table();
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
		// first pass: the source names the facility does not have, with the rows each covers (spec 04.11)
		var unknown = new LinkedHashMap<String, UnknownSource>();
		for (var row : table.rows()) {
			var cells = new Cells(table.header(), row.cells());
			var facility = facilitiesByName.get(cells.get("facility").toLowerCase(Locale.ROOT));
			var sourceName = cells.source();
			if (facility == null || sourceName.isBlank()
					|| streamsByFacility.getOrDefault(facility.getId(), Map.of()).containsKey(sourceName.toLowerCase(Locale.ROOT))) {
				continue;
			}
			var key = unknownKey(facility.getId(), sourceName);
			var seen = unknown.get(key);
			if (seen == null) {
				unknown.put(key, new UnknownSource(facility.getId(), facility.getName(), sourceName, new ArrayList<>(),
						ghg.similarStreams(facility, sourceName)));
				seen = unknown.get(key);
			}
			seen.rows().add(row.number());
		}
		var resolved = resolve(unknown, decided, source, dryRun);
		var undecided = unknown.values()
			.stream()
			.filter(u -> !resolved.containsKey(unknownKey(u.facilityId(), u.name())))
			.map(u -> new UnknownSource(u.facilityId(), u.facilityName(), u.name(), List.copyOf(u.rows()),
					u.candidates()))
			.toList();
		// facts only: a draft is a stub, not something a row could duplicate (spec 04.6)
		var facts = activities.findAllByOrganizationIdAndDeletedAtIsNullAndDraftFalseOrderByPeriodEndDesc(organizationId);
		var existing = facts.stream()
			.map(a -> key(a.getFacility().getId(), a.getActivityType(), a.getQuantity(), a.getUnit(), a.getPeriodStart(),
					a.getPeriodEnd()))
			.collect(Collectors.toCollection(HashSet::new));
		// spec 04.12: a zero after a month that recorded something is worth a look
		var nonZeroByStream = new HashMap<UUID, List<ActivityRecord>>();
		for (var fact : facts) {
			if (fact.getStream() != null && fact.getQuantity() != null && fact.getQuantity().signum() > 0
					&& fact.period() != null) {
				nonZeroByStream.computeIfAbsent(fact.getStream().getId(), k -> new ArrayList<>()).add(fact);
			}
		}
		var zeroNotes = new LinkedHashMap<String, List<Integer>>();
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
		var warnings = new ArrayList<Warning>(source.warnings());
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
			var needsDecision = false;
			var sourceName = cells.source();
			if (!sourceName.isBlank() && facility != null) {
				stream = streamsByFacility.getOrDefault(facility.getId(), Map.of())
					.get(sourceName.toLowerCase(Locale.ROOT));
				if (stream == null) {
					var made = resolved.get(unknownKey(facility.getId(), sourceName));
					if (made != null) {
						stream = made.stream();
					}
					else if (dryRun) {
						// decided in the preview, not rejected (spec 04.11)
						needsDecision = true;
					}
					else {
						problems.add("'" + facility.getName() + "' has no emission source named '" + sourceName + "'");
					}
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
				if (quantity.signum() < 0) {
					problems.add("quantity must be 0 or more");
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
			for (var field : List.of("data_source", "supplier", "evidence_ref", "note")) {
				var limit = field.equals("evidence_ref") ? 150 : field.equals("note") ? 255 : 120;
				if (cells.get(field).length() > limit) {
					problems.add(field + " is longer than " + limit + " characters");
				}
			}
			// spec 04.12: a documented zero says what showed that nothing was consumed
			if (quantity != null && quantity.signum() == 0 && cells.get("note").trim().length() < GhgService.ZERO_NOTE_MIN) {
				problems.add("quantity is 0: say in the note what showed that nothing was consumed");
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
					end, blankToNull(cells.get("data_source")), blankToNull(cells.get("supplier")),
					blankToNull(cells.get("evidence_ref")), quality, blankToNull(cells.get("note")), tier, uncertainty);
			if (!needsDecision) {
				accepted.add(item);
			}
			var record = new ActivityRecord(0, false, facility, stream, item.activityType(), quantity, item.unit(),
					start, end, item.dataSource(), item.supplier(), item.evidenceRef(), quality, item.note(), tier, uncertainty);
			var readiness = ActivityReadiness.of(record, false);
			if (needsDecision) {
				// the source is pending a decision, so its absence is not a readiness issue
				readiness = new ActivityReadiness(readiness.status(), readiness.issues()
					.stream()
					.filter(issue -> issue != ActivityReadiness.Issue.NO_STREAM)
					.toList());
			}
			var shownName = stream != null ? stream.getName() : needsDecision ? sourceName : null;
			previews.add(new PreviewRow(row.number(), facility.getName(), shownName, item.activityType(), quantity,
					item.unit(), start, end, item.dataSource(), item.evidenceRef(), quality, record.getDataQualityTier(),
					readiness, needsDecision));
			var totalKey = facility.getId() + "|"
					+ (stream != null ? stream.getId().toString() : needsDecision ? "?" + sourceName.toLowerCase(Locale.ROOT) : "")
					+ "|" + item.unit().toLowerCase(Locale.ROOT);
			totals.merge(totalKey, new Total(facility.getName(), shownName, item.unit(), 1, quantity),
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
			if (quantity.signum() == 0) {
				zeroNotes.computeIfAbsent(item.note().trim().toLowerCase(Locale.ROOT), k -> new ArrayList<>()).add(row.number());
				if (stream != null) {
					var before = java.time.YearMonth.from(start).minusMonths(1);
					var previous = nonZeroByStream.getOrDefault(stream.getId(), List.of())
						.stream()
						.filter(fact -> fact.period().overlaps(before.atDay(1), before.atEndOfMonth()))
						.findFirst();
					if (previous.isPresent()) {
						warnings.add(new Warning(row.number(), "quantity is 0 but '" + stream.getName() + "' recorded "
								+ previous.get().getQuantity().stripTrailingZeros().toPlainString() + " "
								+ previous.get().getUnit() + " the month before"));
					}
				}
			}
			if (stream != null && item.supplier() != null && stream.getMeterOrSupplier() != null
					&& !stream.getMeterOrSupplier().equalsIgnoreCase(item.supplier())) {
				warnings.add(new Warning(row.number(), "'" + stream.getName() + "' is recorded with the supplier '"
						+ stream.getMeterOrSupplier() + "'; this row names '" + item.supplier() + "'"));
			}
			var formulas = source.formulaCells().getOrDefault(row.number(), Set.of())
				.stream()
				.filter(FIGURE_COLUMNS::contains)
				.toList();
			if (!formulas.isEmpty()) {
				warnings.add(new Warning(row.number(), String.join(" and ", formulas)
						+ (formulas.size() == 1 ? " came from a formula; the saved value is the cached result"
								: " came from formulas; the saved values are the cached results")));
			}
		}
		for (var entry : zeroNotes.entrySet()) {
			if (entry.getValue().size() > 1) {
				warnings.add(new Warning(entry.getValue().getFirst(), "the same note appears on " + entry.getValue().size()
						+ " zero rows: say per source what showed nothing was consumed"));
			}
		}
		return new Parsed(List.copyOf(rejected), List.copyOf(accepted), List.copyOf(previews),
				List.copyOf(totals.values()), List.copyOf(warnings), undecided, List.copyOf(resolved.values()));
	}

	/**
	 * Each decision against the unknown names (spec 04.11): a decision for a name
	 * the file lacks, or a second one for a name, refuses the set. A mapping outside
	 * the suggested candidates needs a reason; a creation meets the reconcile rules
	 * of spec 04.10, and in a dry run is checked without being saved.
	 */
	private Map<String, Made> resolve(Map<String, UnknownSource> unknown, Decisions decided, Source source,
			boolean dryRun) {
		var resolved = new LinkedHashMap<String, Made>();
		if (decided == null || decided.items() == null) {
			return resolved;
		}
		var digestPrefix = source.sha256().substring(0, 8);
		for (var i = 0; i < decided.items().size(); i++) {
			var item = decided.items().get(i);
			if (item.facilityId() == null || item.name() == null || item.name().isBlank()) {
				throw new GhgRuleViolationException(GhgRules.IMPORT_DECISION_UNUSED);
			}
			var key = unknownKey(item.facilityId(), item.name());
			var target = unknown.get(key);
			if (target == null || resolved.containsKey(key)) {
				throw new GhgRuleViolationException(GhgRules.IMPORT_DECISION_UNUSED);
			}
			if ((item.mapTo() == null) == (item.create() == null)) {
				throw new GhgFieldException("decisions[" + i + "]",
						"Map '" + target.name() + "' to an existing emission source or create it, one of the two.");
			}
			var facility = facilities.findById(target.facilityId())
				.orElseThrow(() -> GhgNotFoundException.facility(target.facilityId()));
			var reason = item.reason() == null || item.reason().isBlank() ? null : item.reason().trim();
			var rows = List.copyOf(target.rows());
			var fixed = new UnknownSource(target.facilityId(), target.facilityName(), target.name(), rows,
					target.candidates());
			if (item.mapTo() != null) {
				var stream = streams.findById(item.mapTo()).orElseThrow(() -> GhgNotFoundException.stream(item.mapTo()));
				if (!stream.getFacility().getId().equals(facility.getId())) {
					throw new GhgRuleViolationException(GhgRules.STREAM_OTHER_FACILITY, stream.getName(),
							stream.getFacility().getName(), facility.getName());
				}
				var suggested = target.candidates().stream().anyMatch(c -> c.getId().equals(stream.getId()));
				if (!suggested && (reason == null || reason.length() < GhgService.SIMILAR_REASON_MIN)) {
					throw new GhgFieldException(
							GhgRules.IMPORT_MAP_REASON_REQUIRED.withField("decisions[" + i + "].reason"), stream.getName());
				}
				resolved.put(key, new Made(fixed, ImportDecision.Kind.MAPPED, stream, reason));
				continue;
			}
			var facts = item.create();
			if (dryRun) {
				ghg.checkStreamForImport(facility, facts, reason);
				var transientStream = new SourceStream(facility, facts.name().trim(), facts.kind(), blankToNull(facts.fuel()),
						blankToNull(facts.meterOrSupplier()), facts.contractorOperated(), blankToNull(facts.note()),
						SourceStream.Origin.IMPORT, null);
				resolved.put(key, new Made(fixed, ImportDecision.Kind.CREATED, transientStream, reason));
			}
			else {
				var note = source.fileName() + " (sha256 " + digestPrefix + "); " + StructureChanges.rowsText(rows);
				var stream = ghg.createStreamForImport(facility, facts, reason, note);
				resolved.put(key, new Made(fixed, ImportDecision.Kind.CREATED, stream, reason));
			}
		}
		return resolved;
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

		/** The emission source column; {@code stream}, the column's old name, is still read (spec 04.10). */
		String source() {
			return header.contains("emission_source") ? get("emission_source") : get("stream");
		}
	}
}
