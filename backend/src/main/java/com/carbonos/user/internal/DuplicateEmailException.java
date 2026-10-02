package com.carbonos.user.internal;

import com.carbonos.shared.web.RuleViolation;
import com.carbonos.user.UserRules;

class DuplicateEmailException extends RuleViolation {

	DuplicateEmailException(String email) {
		super(UserRules.EMAIL_DUPLICATE, "Duplicate email", email);
	}
}
