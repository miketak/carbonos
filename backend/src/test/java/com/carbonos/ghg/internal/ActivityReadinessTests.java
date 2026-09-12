package com.carbonos.ghg.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.carbonos.ghg.internal.ActivityReadiness.Issue;

/** The Java side of the readiness rule (spec 04.6); the integration test checks the Criteria side agrees. */
class ActivityReadinessTests {

	private final Organization organization = new Organization("Asante Gold Resources", UUID.randomUUID());
	private final LegalEntity entity = new LegalEntity(organization, "Asante Gold Resources",
			RelationshipType.SUBSIDIARY, new BigDecimal("100.00"), new BigDecimal("100.00"), true, true, null, true);
	private final Facility mine = new Facility(organization, entity, "Nkran Mine", "Obuasi, Ghana", "GH");
	private final SourceStream gensets = new SourceStream(mine, "Standby gensets", StreamKind.STATIONARY_COMBUSTION,
			"Diesel", "Tank meter 3", false, null);

	private ActivityRecord record(boolean draft, SourceStream stream, BigDecimal quantity, String unit,
			LocalDate start, String dataSource, String evidenceRef) {
		return new ActivityRecord(1, draft, mine, stream, "Diesel consumption", quantity, unit, start, start,
				dataSource, evidenceRef, DataQuality.MEASURED, null, null, null);
	}

	@Test
	void aCompleteFactWithAReferenceIsReadyButSaysNothingIsAttached() {
		var readiness = ActivityReadiness.of(record(false, gensets, new BigDecimal("1000"), "litre",
				LocalDate.of(2025, 3, 31), "Fuel register", "INV-2938"), false);
		assertThat(readiness.status()).isEqualTo(ActivityStatus.READY);
		assertThat(readiness.issues()).containsExactly(Issue.EVIDENCE_REFERENCE_ONLY);
		assertThat(readiness.isReady()).isTrue();
	}

	@Test
	void anAttachmentAloneIsEvidence() {
		var readiness = ActivityReadiness.of(record(false, gensets, new BigDecimal("1000"), "litre",
				LocalDate.of(2025, 3, 31), "Fuel register", null), true);
		assertThat(readiness.status()).isEqualTo(ActivityStatus.READY);
		assertThat(readiness.issues()).isEmpty();
	}

	@Test
	void eachMissingPieceIsNamed() {
		var readiness = ActivityReadiness.of(record(false, null, new BigDecimal("1000"), "litre",
				LocalDate.of(2025, 3, 31), null, null), false);
		assertThat(readiness.status()).isEqualTo(ActivityStatus.NEEDS_ATTENTION);
		assertThat(readiness.issues()).containsExactly(Issue.NO_STREAM, Issue.NO_DATA_SOURCE, Issue.NO_EVIDENCE);
	}

	@Test
	void aDraftReportsWhatItStillLacksAndStaysADraft() {
		var readiness = ActivityReadiness.of(record(true, gensets, null, null, null, "Fuel register", "INV-1"), false);
		assertThat(readiness.status()).isEqualTo(ActivityStatus.DRAFT);
		assertThat(readiness.issues()).containsExactly(Issue.MISSING_QUANTITY, Issue.MISSING_UNIT,
				Issue.MISSING_PERIOD, Issue.EVIDENCE_REFERENCE_ONLY);
	}

	@Test
	void theRecordNumberPrintsWithFourDigitsAndGrowsPastThem() {
		assertThat(ActivityRecord.ref(7)).isEqualTo("ACT-0007");
		assertThat(ActivityRecord.ref(12345)).isEqualTo("ACT-12345");
		assertThat(ActivityRecord.ref(null)).isEmpty();
	}
}
