package com.carbonos.ghg.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;

/** Spec 01.10: the form a downloaded CSV gives a date, by the account's choice. */
class CallerDatesTests {

	private static final LocalDate THIRD_OF_APRIL = LocalDate.of(2026, 4, 3);

	@Test
	void dayFirstForGhana() {
		assertThat(CallerDates.formatterFor("DMY").format(THIRD_OF_APRIL)).isEqualTo("03/04/2026");
	}

	@Test
	void monthFirstForTheUnitedStates() {
		assertThat(CallerDates.formatterFor("MDY").format(THIRD_OF_APRIL)).isEqualTo("04/03/2026");
	}

	@Test
	void isoWhileNoChoiceIsMade() {
		assertThat(CallerDates.formatterFor(null).format(THIRD_OF_APRIL)).isEqualTo("2026-04-03");
		assertThat(CallerDates.formatterFor("YMD").format(THIRD_OF_APRIL)).isEqualTo("2026-04-03");
	}
}
