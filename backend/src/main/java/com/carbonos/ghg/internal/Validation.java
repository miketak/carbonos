package com.carbonos.ghg.internal;

import java.util.List;

/** The pre-run validation gates and their findings (spec 003). */
public final class Validation {

	public enum Gate {

		BOUNDARY, COMPLETENESS, CLASSIFICATION, EMISSION_FACTOR

	}

	public enum Severity {

		ERROR, WARNING, INFO

	}

	public enum GateStatus {

		PASSED, WARNINGS, BLOCKED

	}

	public record Finding(Severity severity, String message) {
	}

	public record GateResult(Gate gate, List<Finding> findings) {

		public GateStatus status() {
			if (findings.stream().anyMatch(finding -> finding.severity() == Severity.ERROR)) {
				return GateStatus.BLOCKED;
			}
			if (findings.stream().anyMatch(finding -> finding.severity() == Severity.WARNING)) {
				return GateStatus.WARNINGS;
			}
			return GateStatus.PASSED;
		}
	}

	public record Report(List<GateResult> gates) {

		public boolean ready() {
			return gates.stream().noneMatch(gate -> gate.status() == GateStatus.BLOCKED);
		}
	}

	private Validation() {
	}
}
