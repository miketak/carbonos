package com.carbonos.user.internal;

import com.carbonos.shared.web.RuleViolation;
import com.carbonos.user.UserRules;

class InvalidSetupTokenException extends RuleViolation {

	InvalidSetupTokenException() {
		super(UserRules.SETUP_LINK_INVALID, "Invalid link");
	}
}
