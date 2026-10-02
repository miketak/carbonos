package com.carbonos.user.internal;

import com.carbonos.shared.web.RuleViolation;
import com.carbonos.user.UserRules;

/** The profile's change proves the holder with the current password (spec 01.9); a wrong one is refused here. */
class WrongCurrentPasswordException extends RuleViolation {

	static final String MESSAGE = UserRules.CURRENT_PASSWORD_WRONG.message();

	WrongCurrentPasswordException() {
		super(UserRules.CURRENT_PASSWORD_WRONG, "Validation failed");
	}
}
