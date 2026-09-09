package com.carbonos.ghg.internal.web;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carbonos.ghg.internal.InventoryService;
import com.carbonos.ghg.internal.export.ReportPdf;
import com.carbonos.ghg.internal.export.RunCsv;
import com.carbonos.ghg.internal.web.dto.BoundaryVersionResponse;
import com.carbonos.ghg.internal.web.dto.MarketFactorResponse;
import com.carbonos.ghg.internal.web.dto.ReportResponse;

/** The report as a document, the calculation file, and the frozen inputs (spec 07.5). */
@RestController
@RequestMapping("/api/ghg")
class ExportController {

	private final InventoryService inventoryService;
	private final ReportAssembler reports;

	ExportController(InventoryService inventoryService, ReportAssembler reports) {
		this.inventoryService = inventoryService;
		this.reports = reports;
	}

	@GetMapping(value = "/runs/{id}/report.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
	ResponseEntity<byte[]> pdf(@PathVariable UUID id) {
		var report = reports.assemble(id);
		var name = slug(report.header().organizationName()) + "-" + slug(report.header().periodLabel()) + "-run-"
				+ report.run().runNo() + ".pdf";
		return ResponseEntity.ok()
			.contentType(MediaType.APPLICATION_PDF)
			.header(HttpHeaders.CONTENT_DISPOSITION, attachment(name))
			.body(ReportPdf.render(report));
	}

	@GetMapping(value = "/runs/{id}/lines.csv", produces = "text/csv")
	ResponseEntity<byte[]> lines(@PathVariable UUID id) {
		var run = inventoryService.getRun(id);
		return csv("run-" + run.getRunNo() + "-lines.csv", RunCsv.lines(run));
	}

	@GetMapping(value = "/runs/{id}/exclusions.csv", produces = "text/csv")
	ResponseEntity<byte[]> exclusions(@PathVariable UUID id) {
		var run = inventoryService.getRun(id);
		return csv("run-" + run.getRunNo() + "-exclusions.csv", RunCsv.exclusions(run));
	}

	/** The frozen inputs (spec 07.5): the boundary version, the factor set, the instruments and the residual mix. */
	public record FrozenInputs(UUID runId, int runNo, String label, java.time.LocalDate periodStart,
			java.time.LocalDate periodEnd, String consolidationApproach, String gwpSet, String scope2MarketBasis,
			BoundaryVersionResponse boundaryVersion, List<ReportResponse.FactorRow> factors,
			List<MarketFactorResponse> instruments, Boolean residualMixAvailable,
			java.math.BigDecimal residualMixKgCo2ePerKwh) {
	}

	@GetMapping(value = "/runs/{id}/inputs.json", produces = MediaType.APPLICATION_JSON_VALUE)
	ResponseEntity<FrozenInputs> inputs(@PathVariable UUID id) {
		var report = reports.assemble(id);
		var run = report.run();
		var body = new FrozenInputs(run.id(), run.runNo(), run.label(), run.periodStart(), run.periodEnd(),
				run.consolidationApproach().name(), run.gwpSet().name(), run.scope2MarketBasis().name(),
				report.company().boundaryVersion(), report.factors(), report.emissions().marketInstruments(),
				report.emissions().residualMixAvailable(), report.emissions().residualMixKgCo2ePerKwh());
		return ResponseEntity.ok()
			.header(HttpHeaders.CONTENT_DISPOSITION, attachment("run-" + run.runNo() + "-inputs.json"))
			.body(body);
	}

	private static ResponseEntity<byte[]> csv(String name, String content) {
		return ResponseEntity.ok()
			.contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
			.header(HttpHeaders.CONTENT_DISPOSITION, attachment(name))
			.body(content.getBytes(StandardCharsets.UTF_8));
	}

	private static String attachment(String name) {
		return ContentDisposition.attachment().filename(name, StandardCharsets.UTF_8).build().toString();
	}

	private static String slug(String text) {
		return text.toLowerCase(java.util.Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
	}
}
