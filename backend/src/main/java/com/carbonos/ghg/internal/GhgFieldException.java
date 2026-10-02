package com.carbonos.ghg.internal;

import java.util.Map;

import org.springframework.http.HttpStatus;
import com.carbonos.shared.web.Rule;
import com.carbonos.shared.web.RuleViolation;

/** A request field the service rejects: 422 with the message under {@code errors.<field>}, like bean validation. */
class GhgFieldException extends RuleViolation {

	GhgFieldException(Rule rule, Object... values) {
		super(rule, "Invalid request", values);
	}

	/** A refusal not yet named by a rule in {@link com.carbonos.ghg.GhgRules}. */
	GhgFieldException(String field, String message) {
		super(HttpStatus.UNPROCESSABLE_ENTITY, "Invalid request", message);
		getBody().setProperty("errors", Map.of(field, message));
	}
}
