package com.carbonos.ghg.internal;

import java.util.List;

/** The pre-run validation gates and their findings (spec 05, spec 06). */
public final class Validation {

	public enum Gate {
		BOUNDARY, COMPLETENESS, CLASSIFICATION, EMISSION_FACTOR, BASE_YEAR
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
		/**
		 * Whether a calculation run may be launched. The base-year gate never holds a
		 * run: it holds the final designation and the publication (spec 06.1), because
		 * quantifying the movement is how a recalculation is assessed.
		 */
		public boolean ready() {
			return gates.stream()
				.noneMatch(gate -> gate.status() == GateStatus.BLOCKED && gate.gate() != Gate.BASE_YEAR);
		}

		/** Whether a gate holds the final designation and the publication without holding a run. */
		public boolean holdsFinal() {
			return gates.stream()
				.anyMatch(gate -> gate.status() == GateStatus.BLOCKED && gate.gate() == Gate.BASE_YEAR);
		}
	}

	private Validation() {
	}
}
