package com.carbonos.ghg.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.stream.Stream;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import com.carbonos.ghg.internal.EngineVectors.ProRatingSum;
import com.carbonos.ghg.internal.EngineVectors.ProRatingVector;

/**
 * The days a frozen boundary covers of a record and the share they make
 * (spec 04.2): the record's period clipped to the inventory and to the
 * entity's membership window, leap years counted, adjacent windows summing to
 * one.
 */
class ProRatingVectorsTest {

	static Stream<ProRatingVector> proRatingVectors() {
		return EngineVectors.load().proRating().stream();
	}

	static Stream<ProRatingSum> proRatingSums() {
		return EngineVectors.load().proRatingSums().stream();
	}

	private static BoundaryVersion.Coverage coverageOf(ProRatingVector vector) {
		var fixtures = new EngineFixtures();
		var inputs = vector.inputs();
		var inventory = fixtures.inventory("OPERATIONAL_CONTROL", "AR5", inputs.inventoryPeriod());
		var facility = fixtures.facility("Kumasi Plant");
		var version = fixtures.boundary(inventory, facility, EngineFixtures.date(inputs.windowFrom()),
				EngineFixtures.date(inputs.windowTo()));
		return version.coverage(facility.getId(), EngineFixtures.date(inputs.record().start()),
				EngineFixtures.date(inputs.record().end()), inventory.getPeriodStart(), inventory.getPeriodEnd());
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("proRatingVectors")
	void eachWindowCoversTheDaysTheHandCountGives(ProRatingVector vector) {
		var coverage = coverageOf(vector);
		var want = vector.expected();
		assertThat(coverage.totalDays()).as("%s days", vector.id()).isEqualTo(want.days());
		assertThat(coverage.coveredDays()).as("%s covered days", vector.id()).isEqualTo(want.coveredDays());
		assertThat(LineMath.periodShare(coverage)).as("%s period share", vector.id()).isEqualByComparingTo(want.periodShare());
		var period = LineMath.period(EngineFixtures.date(vector.inputs().record().start()),
				EngineFixtures.date(vector.inputs().record().end()), coverage);
		assertThat(period.note()).as("%s period note", vector.id()).isEqualTo(want.periodNote());
		assertThat(new DatePeriod(period.start(), period.end()).days()).isEqualTo(want.days());
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("proRatingSums")
	void adjacentWindowsShareOneRecordExactly(ProRatingSum sum) {
		var total = BigDecimal.ZERO;
		for (var id : sum.vectors()) {
			var vector = proRatingVectors().filter(v -> v.id().equals(id)).findFirst().orElseThrow();
			total = total.add(LineMath.periodShare(coverageOf(vector)));
		}
		assertThat(total).as("%s", sum.id()).isEqualByComparingTo(sum.expected());
	}
}
