package com.carbonos.ghg.internal.web;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.FactorPackImportService;
import com.carbonos.ghg.internal.FactorPackRow;
import com.carbonos.ghg.internal.FactorPackRowsService;
import com.carbonos.ghg.internal.FactorPacks;
import com.carbonos.ghg.internal.GhgService;
import com.carbonos.ghg.internal.ReportingBasis;
import com.carbonos.ghg.internal.Scope;

/** The importable factor packs (spec 02.1). */
@RestController
@RequestMapping("/api/ghg")
class FactorPackController {

	/** A pack's header, without its factors. */
	record PackSummary(String id, String name, String source, String sourceUrl, Integer publicationYear,
			String gwpBasis, String license, String retrieved, int factorCount, String notes) {
		static PackSummary of(FactorPacks.PackHeader header) {
			return new PackSummary(header.id(), header.name(), header.source(), header.sourceUrl(),
					header.publicationYear(), header.gwpBasis(), header.license(), header.retrieved(),
					header.factorCount(), header.notes());
		}
	}

	/**
	 * One factor of a pack as an organization reads it. The publisher's taxonomy
	 * reaches this response as the one path it has always been: the three
	 * columns of spec 02.5 are how the catalogue holds a row, not a change to
	 * what an organization is shown.
	 */
	record PackFactorResponse(String code, String name, Scope defaultScope, ActivityCategory defaultCategory,
			boolean scopeAgnostic, String unit, BigDecimal kgCo2ePerUnit, BigDecimal co2, BigDecimal ch4,
			boolean ch4Fossil, BigDecimal n2o, BigDecimal hfcsKg, BigDecimal pfcsKg, BigDecimal sf6, BigDecimal nf3,
			String blendComposition, String blendGwpSource, BigDecimal biogenicCo2, Integer dataYear,
			String sourceDetail, boolean approved, String notes, String sourcePublication, String sourceUrl,
			Integer publicationYear, ReportingBasis reportingBasis) {
		static PackFactorResponse of(FactorPacks.PackFactor factor) {
			return new PackFactorResponse(factor.code(), factor.name(), factor.defaultScope(),
					factor.defaultCategory(), factor.scopeAgnostic(), factor.unit(), factor.kgCo2ePerUnit(),
					factor.co2(), factor.ch4(), factor.ch4Fossil(), factor.n2o(), factor.hfcsKg(), factor.pfcsKg(),
					factor.sf6(), factor.nf3(), factor.blendComposition(), factor.blendGwpSource(),
					factor.biogenicCo2(), factor.dataYear(), factor.sourcePath(), factor.approved(), factor.notes(),
					factor.sourcePublication(), factor.sourceUrl(), factor.publicationYear(),
					factor.reportingBasis());
		}
	}

	/** A pack with its factors. */
	record PackDetail(String id, String name, String source, String sourceUrl, Integer publicationYear,
			String gwpBasis, String license, String retrieved, String notes, List<PackFactorResponse> factors) {
		static PackDetail of(FactorPacks.Pack pack) {
			return new PackDetail(pack.id(), pack.name(), pack.source(), pack.sourceUrl(), pack.publicationYear(),
					pack.gwpBasis(), pack.license(), pack.retrieved(), pack.notes(),
					pack.factors().stream().map(PackFactorResponse::of).toList());
		}
	}

	/**
	 * One row of an edition as an organization reads it (spec 02.8). The
	 * publisher's category, activity and unit are part of the identity, not
	 * decoration: 1,157 of the 1,868 rows of defra-2026 share a name with
	 * another row, and the three named "Gaseous fuels: Butane" differ only by
	 * unit.
	 */
	record PackRowResponse(String code, String name, String sourceCategory, String sourceActivity,
			String sourceDetail, String unit, BigDecimal kgCo2ePerUnit, Scope defaultScope,
			ActivityCategory defaultCategory, ReportingBasis reportingBasis, boolean co2eOnly, boolean approved) {
		static PackRowResponse of(FactorPackRow row) {
			return new PackRowResponse(row.getCode(), row.getName(), row.getSourceCategory(), row.getSourceActivity(),
					row.getSourceDetail(), row.getUnit(), row.getKgCo2ePerUnit(), row.getDefaultScope(),
					row.getDefaultCategory(), row.getReportingBasis(), row.isCo2eOnly(), row.isApproved());
		}
	}

	/** A page of an edition's rows, with the categories the whole edition carries. */
	record PackRowPage(List<PackRowResponse> rows, int page, int size, long total, List<String> categories) {
		static PackRowPage of(FactorPackRowsService.RowPage page) {
			return new PackRowPage(page.rows().stream().map(PackRowResponse::of).toList(), page.page(), page.size(),
					page.total(), page.categories());
		}
	}

	private final FactorPacks packs;
	private final GhgService ghgService;
	private final FactorPackImportService imports;

	private final FactorPackRowsService packRows;

	FactorPackController(FactorPacks packs, GhgService ghgService, FactorPackImportService imports,
			FactorPackRowsService packRows) {
		this.packs = packs;
		this.ghgService = ghgService;
		this.imports = imports;
		this.packRows = packRows;
	}

	@GetMapping("/factor-packs")
	List<PackSummary> list() {
		// the header projection counts the rows in the database rather than assembling them (spec 02.5)
		return packs.headers().stream().map(PackSummary::of).toList();
	}

	@GetMapping("/factor-packs/{packId}")
	PackDetail get(@PathVariable String packId) {
		return PackDetail.of(ghgService.pack(packId));
	}

	@GetMapping("/organizations/{organizationId}/factor-packs/{packId}/rows")
	PackRowPage rows(@PathVariable UUID organizationId, @PathVariable String packId,
			@RequestParam(required = false) String q, @RequestParam(required = false) String category,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
		return PackRowPage.of(packRows.rows(organizationId, packId, q, category, page, size));
	}

	@PostMapping("/organizations/{organizationId}/factor-packs/{packId}/import")
	FactorPackImportService.ImportResult importPack(@PathVariable UUID organizationId, @PathVariable String packId) {
		return imports.importPack(organizationId, packId);
	}
}
