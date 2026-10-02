package com.carbonos.platform.internal;

import com.carbonos.shared.web.Rule;
import com.carbonos.shared.web.RuleViolation;

/** A setting refused under its field (spec 01.5); the rules are in {@link com.carbonos.platform.PlatformRules}. */
class PlatformFieldException extends RuleViolation {

	PlatformFieldException(Rule rule, Object... values) {
		super(rule, "Invalid request", values);
	}
}
