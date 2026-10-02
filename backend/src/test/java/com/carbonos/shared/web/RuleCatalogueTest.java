package com.carbonos.shared.web;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.carbonos.platform.PlatformRules;
import com.carbonos.user.UserRules;

/** The rule catalogue the QA scenarios cite: one id per refusal, and every message says something. */
class RuleCatalogueTest {

	static final List<RuleSource> SOURCES = List.of(new UserRules(), new PlatformRules());

	@Test
	void idsAreUniqueAcrossModules() {
		var seen = new HashSet<String>();
		for (var source : SOURCES) {
			for (var rule : source.rules()) {
				assertThat(seen.add(rule.id())).as("rule id %s appears twice", rule.id()).isTrue();
			}
		}
	}

	@Test
	void idsAreLowerCaseDottedAndMessagesNonBlank() {
		for (var source : SOURCES) {
			for (var rule : source.rules()) {
				assertThat(rule.id()).matches("[a-z][a-z0-9-]*(\\.[a-z0-9-]+)+");
				assertThat(rule.message()).isNotBlank();
			}
		}
	}

	@Test
	void formatFillsPlaceholdersInOrder() {
		assertThat(PlatformRules.SUPPORT_WINDOW_RANGE.format(1, 72))
			.isEqualTo("Support access lasts between 1 and 72 hours.");
		assertThat(UserRules.EMAIL_DUPLICATE.format("kofi@example.test"))
			.isEqualTo("A user with email 'kofi@example.test' already exists.");
	}

	@Test
	void violationCarriesTheRuleIdAndTheFieldMessage() {
		var violation = new RuleViolation(PlatformRules.REASON_TOO_SHORT, "Invalid request", 10);
		assertThat(violation.getBody().getDetail()).isEqualTo("Give a reason of at least 10 characters.");
		assertThat(violation.getBody().getProperties()).containsEntry("rule", "platform.reason-too-short");
		assertThat(violation.getBody().getProperties().get("errors")).asInstanceOf(
				org.assertj.core.api.InstanceOfAssertFactories.MAP).containsEntry("reason",
						"Give a reason of at least 10 characters.");
	}
}
