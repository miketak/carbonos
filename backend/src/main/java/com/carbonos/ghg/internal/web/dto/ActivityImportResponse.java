package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityImportService;
import com.carbonos.ghg.internal.ActivityReadiness;
import com.carbonos.ghg.internal.DataQuality;

/**
 * The outcome of an import (spec 04.5): how many rows were imported, or each
 * rejected row and why. A dry run (spec 04.6) carries the rows as they would
 * import with their readiness, the control totals and the warnings; since spec
 * 04.11 also the file's digest and the emission source names the facility does
 * not have, each with the rows it covers and the near names the preview offers.
 * A row waiting on one of those has the status {@code NEEDS_DECISION}.
 */
public record ActivityImportResponse(boolean dryRun, UUID batchId, int imported, List<Rejection> rejected,
		List<PreviewRow> rows, List<Total> totals, List<Warning> warnings, String sha256,
		List<UnknownSource> unknownSources, int sourcesCreated) {

	public static final String NEEDS_DECISION = "NEEDS_DECISION";

	public record Rejection(int row, String message) {
	}

	public record PreviewRow(int row, String facilityName, String streamName, String activityType,
			BigDecimal quantity, String unit, LocalDate periodStart, LocalDate periodEnd, String dataSource,
			String evidenceRef, DataQuality dataQuality, int dataQualityTier, String status,
			List<ActivityReadiness.Issue> issues) {
	}

	public record Total(String facilityName, String streamName, String unit, int rows, BigDecimal quantity) {
	}

	/** {@code row} is null for a warning about the file itself (a workbook with several sheets). */
	public record Warning(Integer row, String message) {
	}

	public record UnknownSource(UUID facilityId, String facility, String name, List<Integer> rows,
			List<Candidate> candidates) {
	}

	public record Candidate(UUID id, String name, String kind, String defaultScope, String defaultCategory) {
	}

	public static ActivityImportResponse from(ActivityImportService.Result result) {
		return new ActivityImportResponse(result.dryRun(), result.batchId(), result.imported(),
				result.rejected().stream().map(r -> new Rejection(r.row(), r.message())).toList(),
				result.rows()
					.stream()
					.map(r -> new PreviewRow(r.row(), r.facilityName(), r.streamName(), r.activityType(), r.quantity(),
							r.unit(), r.periodStart(), r.periodEnd(), r.dataSource(), r.evidenceRef(), r.dataQuality(),
							r.dataQualityTier(), r.needsDecision() ? NEEDS_DECISION : r.readiness().status().name(),
							r.readiness().issues()))
					.toList(),
				result.totals()
					.stream()
					.map(t -> new Total(t.facilityName(), t.streamName(), t.unit(), t.rows(), t.quantity()))
					.toList(),
				result.warnings().stream().map(w -> new Warning(w.row(), w.message())).toList(), result.sha256(),
				result.unknownSources()
					.stream()
					.map(u -> new UnknownSource(u.facilityId(), u.facilityName(), u.name(), u.rows(),
							u.candidates()
								.stream()
								.map(c -> new Candidate(c.getId(), c.getName(), c.getKind().name(),
										c.defaultScope().name(), c.defaultCategory().name()))
								.toList()))
					.toList(),
				result.sourcesCreated());
	}
}
