package com.carbonos.help.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

/** The cleaning and screening rules of spec 09, without a database. */
class HelpServiceRulesTest {

	@Test
	void aQueryIsTrimmedLoweredStrippedOfPunctuationAndCapped() {
		assertThat(HelpService.normalizeQuery("  Recalcuation!  ")).isEqualTo("recalcuation");
		assertThat(HelpService.normalizeQuery("Scope 2,   market-based?")).isEqualTo("scope 2 marketbased");
		assertThat(HelpService.normalizeQuery("tab\there\nand\u0007bell")).isEqualTo("tab here and bell");
		assertThat(HelpService.normalizeQuery("x".repeat(200))).hasSize(HelpService.QUERY_MAX_LENGTH);
		assertThat(HelpService.normalizeQuery(" ? ")).isEmpty();
	}

	@Test
	void aCommentLosesItsControlCharactersBeforeItIsMeasured() {
		assertThat(HelpService.cleanComment(null)).isNull();
		assertThat(HelpService.cleanComment("  \u0007 \n ")).isNull();
		assertThat(HelpService.cleanComment("Step 3\nis missing.\u0000")).isEqualTo("Step 3 is missing.");
		assertThat(HelpService.cleanComment("x".repeat(HelpService.COMMENT_MAX_LENGTH) + "\u0007"))
			.hasSize(HelpService.COMMENT_MAX_LENGTH);
		assertThatThrownBy(() -> HelpService.cleanComment("x".repeat(HelpService.COMMENT_MAX_LENGTH + 1)))
			.isInstanceOf(HelpFieldException.class);
	}

	@Test
	void aCommentMayNotCarryAnAddressOrALongNumber() {
		assertThatThrownBy(() -> HelpService.cleanComment("write to kofi.mensah@example.com"))
			.isInstanceOf(HelpFieldException.class);
		assertThatThrownBy(() -> HelpService.cleanComment("call me on 0244123456"))
			.isInstanceOf(HelpFieldException.class);
		// an inventory year or a short figure is not a phone number
		assertThat(HelpService.cleanComment("FY2025 total was 12345678 kg")).isEqualTo("FY2025 total was 12345678 kg");
	}
}
