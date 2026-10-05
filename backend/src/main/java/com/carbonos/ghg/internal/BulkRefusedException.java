package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.GhgRules;
import com.carbonos.shared.web.RuleViolation;

/**
 * An act over several records refused as a whole (spec 04.11): 409 naming how
 * many records refuse it, with each one listed under {@code refused} with its
 * reference, the rule and the message, so the analyst deselects them and tries
 * again. Nothing was applied.
 */
class BulkRefusedException extends RuleViolation {

	/** One record that refuses the act. */
	public record Refused(UUID id, String recordRef, String rule, String message) {
	}

	BulkRefusedException(List<Refused> refused, int selected) {
		super(GhgRules.ACTIVITY_BULK_REFUSED, "Operation not allowed", refused.size(), selected);
		getBody().setProperty("refused", refused);
	}
}
