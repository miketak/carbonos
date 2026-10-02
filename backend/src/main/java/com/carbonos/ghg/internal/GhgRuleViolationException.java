package com.carbonos.ghg.internal;

import org.springframework.http.HttpStatus;
import com.carbonos.shared.web.Rule;
import com.carbonos.shared.web.RuleViolation;

class GhgRuleViolationException extends RuleViolation {

	GhgRuleViolationException(Rule rule, Object... values) {
		super(rule, "Operation not allowed", values);
	}

	/** A refusal not yet named by a rule in {@link com.carbonos.ghg.GhgRules}. */
	GhgRuleViolationException(String detail) {
		super(HttpStatus.CONFLICT, "Operation not allowed", detail);
	}
}
