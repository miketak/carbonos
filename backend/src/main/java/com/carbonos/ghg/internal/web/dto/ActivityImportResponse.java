package com.carbonos.ghg.internal.web.dto;

import java.util.List;

import com.carbonos.ghg.internal.ActivityImportService;

/** The outcome of a CSV import (spec 04.5): how many rows were imported, or each rejected row and why. */
public record ActivityImportResponse(int imported, List<Rejection> rejected) {

	public record Rejection(int row, String message) {
	}

	public static ActivityImportResponse from(ActivityImportService.Result result) {
		return new ActivityImportResponse(result.imported(),
				result.rejected().stream().map(r -> new Rejection(r.row(), r.message())).toList());
	}
}
