package com.carbonos.ghg.internal.web.dto;

import java.util.List;

import com.carbonos.ghg.internal.InventoryService;
import com.carbonos.ghg.internal.Validation;

/** The pre-flight gates, plus the records that would stop a freeze (spec 05.5) so the dialog can say why. */
public record ValidationReportResponse(boolean ready, List<GateResponse> gates,
		List<InventoryService.FreezeBlocker> freezeBlockers) {

	public record GateResponse(Validation.Gate gate, Validation.GateStatus status,
			List<FindingResponse> findings) {
	}

	public record FindingResponse(Validation.Severity severity, String message) {
	}

	public static ValidationReportResponse from(Validation.Report report,
			List<InventoryService.FreezeBlocker> freezeBlockers) {
		return new ValidationReportResponse(report.ready(), report.gates()
			.stream()
			.map(gate -> new GateResponse(gate.gate(), gate.status(),
					gate.findings()
						.stream()
						.map(finding -> new FindingResponse(finding.severity(), finding.message()))
						.toList()))
			.toList(), freezeBlockers);
	}
}
