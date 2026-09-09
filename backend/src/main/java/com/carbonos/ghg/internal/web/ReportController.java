package com.carbonos.ghg.internal.web;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carbonos.ghg.internal.web.dto.ReportResponse;

/**
 * The inventory report read from one run, in the order Chapter 9 lists its
 * required elements (spec 07.1).
 */
@RestController
@RequestMapping("/api/ghg")
class ReportController {

	private final ReportAssembler reports;

	ReportController(ReportAssembler reports) {
		this.reports = reports;
	}

	@GetMapping("/runs/{id}/report")
	ReportResponse report(@PathVariable UUID id) {
		return reports.assemble(id);
	}
}
