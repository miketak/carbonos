package com.carbonos.user.internal;

import com.carbonos.shared.web.RuleViolation;
import com.carbonos.user.UserRules;

public class WeakPasswordException extends RuleViolation {

	public WeakPasswordException() {
		this("password");
	}

	/** The rule under the form's own field name: {@code temporaryPassword} on Users, {@code newPassword} on the profile (spec 01.9). */
	public WeakPasswordException(String field) {
		super(UserRules.PASSWORD_WEAK.withField(field), "Validation failed");
	}
}
