package com.carbonos.user.internal;

import com.carbonos.shared.web.RuleViolation;
import com.carbonos.user.UserRules;

public class WeakPasswordException extends RuleViolation {

	public WeakPasswordException() {
		this("password");
	}

	/** The rule under the form's own field name (the profile's is {@code newPassword}, spec 01.9). */
	public WeakPasswordException(String field) {
		super("newPassword".equals(field) ? UserRules.NEW_PASSWORD_WEAK : UserRules.PASSWORD_WEAK, "Validation failed");
	}
}
