package com.carbonos.user.internal.web;

import com.carbonos.shared.web.RuleViolation;
import com.carbonos.user.UserRules;

class InvalidCredentialsException extends RuleViolation {

	InvalidCredentialsException() {
		super(UserRules.CREDENTIALS_INVALID, "Invalid credentials");
	}
}
