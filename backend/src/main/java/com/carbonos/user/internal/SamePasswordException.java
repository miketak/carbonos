package com.carbonos.user.internal;

import com.carbonos.shared.web.RuleViolation;
import com.carbonos.user.UserRules;

class SamePasswordException extends RuleViolation {

	static final String MESSAGE = UserRules.PASSWORD_SAME.message();

	SamePasswordException() {
		super(UserRules.PASSWORD_SAME, "Validation failed");
	}
}
