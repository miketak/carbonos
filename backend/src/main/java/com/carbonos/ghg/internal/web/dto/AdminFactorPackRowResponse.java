package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.FactorPackAdminService;
import com.carbonos.ghg.internal.FactorPackRow;
import com.carbonos.ghg.internal.ReportingBasis;
import com.carbonos.ghg.internal.Scope;

/**
 * One row of an edition as the workbench edits it (spec 02.5): the publisher's
 * three taxonomy parts apart, every gas as the publication states it, and null
 * where it states nothing, which is not the same as a stated zero.
 */
public record AdminFactorPackRowResponse(UUID id, String editionId, int ordinal, String code, String name,
		Scope defaultScope, ActivityCategory defaultCategory, boolean scopeAgnostic, String unit,
		BigDecimal kgCo2ePerUnit, BigDecimal co2KgPerUnit, BigDecimal ch4KgPerUnit, boolean ch4Fossil,
		BigDecimal n2oKgPerUnit, BigDecimal hfcsKgPerUnit, BigDecimal pfcsKgPerUnit, BigDecimal sf6KgPerUnit,
		BigDecimal nf3KgPerUnit, BigDecimal biogenicCo2KgPerUnit, String blendComposition, String blendGwpSource,
		Integer dataYear, String sourcePublication, String sourceUrl, Integer publicationYear, String sourceCategory,
		String sourceActivity, String sourceDetail, boolean co2eOnly, boolean approved, String notes,
		ReportingBasis reportingBasis) {

	public static AdminFactorPackRowResponse from(FactorPackRow row) {
		var facts = row.facts();
		return new AdminFactorPackRowResponse(row.getId(), row.getEditionId(), row.getOrdinal(), facts.code(),
				facts.name(), facts.defaultScope(), facts.defaultCategory(), facts.scopeAgnostic(), facts.unit(),
				facts.kgCo2ePerUnit(), facts.co2(), facts.ch4(), facts.ch4Fossil(), facts.n2o(), facts.hfcsKg(),
				facts.pfcsKg(), facts.sf6(), facts.nf3(), facts.biogenicCo2(), facts.blendComposition(),
				facts.blendGwpSource(), facts.dataYear(), facts.sourcePublication(), facts.sourceUrl(),
				facts.publicationYear(), facts.sourceCategory(), facts.sourceActivity(), facts.sourceDetail(),
				facts.co2eOnly(), facts.approved(), facts.notes(), row.getReportingBasis());
	}

	/** One page of rows with the values the workbench's filters offer. */
	public record Page(List<AdminFactorPackRowResponse> items, int page, int size, long total,
			List<String> categories, List<String> activities, List<String> units) {

		public static Page from(FactorPackAdminService.RowPage page) {
			return new Page(page.rows().stream().map(AdminFactorPackRowResponse::from).toList(), page.page(),
					page.size(), page.total(), page.categories(), page.activities(), page.units());
		}
	}
}
