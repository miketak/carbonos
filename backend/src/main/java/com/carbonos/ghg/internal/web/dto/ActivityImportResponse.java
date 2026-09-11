package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityImportService;
import com.carbonos.ghg.internal.ActivityReadiness;
import com.carbonos.ghg.internal.ActivityStatus;
import com.carbonos.ghg.internal.DataQuality;

/**
 * The outcome of a CSV import (spec 04.5): how many rows were imported, or
 * each rejected row and why. A dry run (spec 04.6) carries the rows as they
 * would import with their readiness, the control totals and the warnings.
 */
public record ActivityImportResponse(boolean dryRun, UUID batchId, int imported, List<Rejection> rejected,
		List<PreviewRow> rows, List<Total> totals, List<Warning> warnings) {

	public record Rejection(int row, String message) {
	}

	public record PreviewRow(int row, String facilityName, String streamName, String activityType,
			BigDecimal quantity, String unit, LocalDate periodStart, LocalDate periodEnd, String dataSource,
			String evidenceRef, DataQuality dataQuality, int dataQualityTier, ActivityStatus status,
			List<ActivityReadiness.Issue> issues) {
	}

	public record Total(String facilityName, String streamName, String unit, int rows, BigDecimal quantity) {
	}

	public record Warning(int row, String message) {
	}

	public static ActivityImportResponse from(ActivityImportService.Result result) {
		return new ActivityImportResponse(result.dryRun(), result.batchId(), result.imported(),
				result.rejected().stream().map(r -> new Rejection(r.row(), r.message())).toList(),
				result.rows()
					.stream()
					.map(r -> new PreviewRow(r.row(), r.facilityName(), r.streamName(), r.activityType(), r.quantity(),
							r.unit(), r.periodStart(), r.periodEnd(), r.dataSource(), r.evidenceRef(), r.dataQuality(),
							r.dataQualityTier(), r.readiness().status(), r.readiness().issues()))
					.toList(),
				result.totals()
					.stream()
					.map(t -> new Total(t.facilityName(), t.streamName(), t.unit(), t.rows(), t.quantity()))
					.toList(),
				result.warnings().stream().map(w -> new Warning(w.row(), w.message())).toList());
	}
}
