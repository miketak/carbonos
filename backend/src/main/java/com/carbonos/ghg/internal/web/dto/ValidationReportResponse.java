package com.carbonos.ghg.internal.web.dto;

import java.util.List;

import com.carbonos.ghg.internal.Validation;

public record ValidationReportResponse(boolean ready, List<GateResponse> gates) {

	public record GateResponse(Validation.Gate gate, Validation.GateStatus status,
			List<FindingResponse> findings) {
	}

	public record FindingResponse(Validation.Severity severity, String message) {
	}

	public static ValidationReportResponse from(Validation.Report report) {
		return new ValidationReportResponse(report.ready(), report.gates()
			.stream()
			.map(gate -> new GateResponse(gate.gate(), gate.status(),
					gate.findings()
						.stream()
						.map(finding -> new FindingResponse(finding.severity(), finding.message()))
						.toList()))
			.toList());
	}
}
