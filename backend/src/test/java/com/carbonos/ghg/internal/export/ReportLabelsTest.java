package com.carbonos.ghg.internal.export;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.AssuranceLevel;
import com.carbonos.ghg.internal.ConsolidationApproach;
import com.carbonos.ghg.internal.Scope;

/** The PDF's label dictionary (spec 07.8): every constant has a reader's word, and none prints as its own name. */
class ReportLabelsTest {

	@Test
	void everyConstantOfEveryReportEnumHasALabelThatIsNotItsName() {
		for (var type : ReportLabels.COVERED) {
			for (var constant : type.getEnumConstants()) {
				var label = ReportLabels.label(constant);
				assertThat(label).as("%s.%s", type.getSimpleName(), constant.name()).isNotBlank().isNotEqualTo(constant.name());
				assertThat(label).as("%s.%s", type.getSimpleName(), constant.name()).doesNotMatch(".*\\b[A-Z]+_[A-Z_]+\\b.*");
			}
		}
	}

	@Test
	void labelsAreThoseOfTheReportPage() {
		assertThat(ReportLabels.label(ConsolidationApproach.OPERATIONAL_CONTROL)).isEqualTo("Operational control");
		assertThat(ReportLabels.lower(ConsolidationApproach.OPERATIONAL_CONTROL)).isEqualTo("operational control");
		assertThat(ReportLabels.label(ActivityCategory.FUEL_ENERGY_RELATED)).isEqualTo("3. Fuel- and energy-related activities");
		assertThat(ReportLabels.label(AssuranceLevel.UNVERIFIED)).isEqualTo("Not verified");
		assertThat(ReportLabels.list(List.of(Scope.SCOPE_1, Scope.SCOPE_2, Scope.SCOPE_3))).isEqualTo("Scope 1, Scope 2, Scope 3");
		assertThat(ReportLabels.criterion("CONVEYS_ATTRIBUTE")).isEqualTo("Conveys the attribute");
		assertThat(ReportLabels.criterion("SOMETHING_ELSE")).isEqualTo("something else");
	}

	@Test
	void datesPrintForAReaderInUtc() {
		assertThat(ReportLabels.date(LocalDate.of(2025, 12, 15))).isEqualTo("15 December 2025");
		assertThat(ReportLabels.period(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31)))
			.isEqualTo("1 January 2025 to 31 December 2025");
		assertThat(ReportLabels.period(LocalDate.of(2025, 3, 15), LocalDate.of(2025, 3, 15))).isEqualTo("15 March 2025");
		assertThat(ReportLabels.instant(Instant.parse("2026-09-12T05:38:08.038809Z"))).isEqualTo("12 September 2026, 05:38 UTC");
		assertThat(ReportLabels.instant(null)).isEmpty();
	}
}
