package com.carbonos.user.internal;

import com.carbonos.shared.web.RuleViolation;
import com.carbonos.user.UserRules;

class DuplicateAccessRequestException extends RuleViolation {

	DuplicateAccessRequestException(String email) {
		super(UserRules.ACCESS_REQUEST_DUPLICATE, "Duplicate request", email);
	}
}
