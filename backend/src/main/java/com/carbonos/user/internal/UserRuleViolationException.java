package com.carbonos.user.internal;

import org.springframework.http.HttpStatus;

import com.carbonos.shared.web.Rule;
import com.carbonos.shared.web.RuleViolation;

class UserRuleViolationException extends RuleViolation {

	UserRuleViolationException(Rule rule, Object... values) {
		super(rule, "Operation not allowed", values);
	}

	/** A refusal not yet named by a rule in {@link com.carbonos.user.UserRules}. */
	UserRuleViolationException(String detail) {
		super(HttpStatus.CONFLICT, "Operation not allowed", detail);
	}
}
