package com.carbonos.ghg.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.carbonos.ghg.internal.Validation.Finding;
import com.carbonos.ghg.internal.Validation.Gate;
import com.carbonos.ghg.internal.Validation.GateResult;
import com.carbonos.ghg.internal.Validation.Report;
import com.carbonos.ghg.internal.Validation.Severity;

/** The base-year gate holds the final designation, never a calculation run (spec 06.1). */
class ValidationReportTest {

	private static GateResult blocked(Gate gate) {
		return new GateResult(gate, List.of(new Finding(Severity.ERROR, "held")));
	}

	private static GateResult passing(Gate gate) {
		return new GateResult(gate, List.of());
	}

	@Test
	void aBlockedBaseYearGateLeavesTheRunAvailable() {
		var report = new Report(List.of(passing(Gate.BOUNDARY), passing(Gate.COMPLETENESS),
				passing(Gate.CLASSIFICATION), passing(Gate.EMISSION_FACTOR), blocked(Gate.BASE_YEAR)));

		assertThat(report.ready()).isTrue();
		assertThat(report.holdsFinal()).isTrue();
	}

	@Test
	void anyOtherBlockedGateHoldsTheRun() {
		var report = new Report(List.of(blocked(Gate.BOUNDARY), passing(Gate.BASE_YEAR)));

		assertThat(report.ready()).isFalse();
		assertThat(report.holdsFinal()).isFalse();
	}
}
