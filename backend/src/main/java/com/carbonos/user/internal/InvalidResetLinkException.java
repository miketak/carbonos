package com.carbonos.user.internal;

import com.carbonos.shared.web.Rule;
import com.carbonos.shared.web.RuleViolation;
import com.carbonos.user.UserRules;

/** A reset link that opens nothing (spec 01.9): unknown, spent, or past its hour. */
class InvalidResetLinkException extends RuleViolation {

	static final String UNKNOWN = UserRules.RESET_LINK_INVALID.message();

	static final String USED = UserRules.RESET_LINK_USED.message();

	static final String EXPIRED = UserRules.RESET_LINK_EXPIRED.message();

	private InvalidResetLinkException(Rule rule) {
		super(rule, "Invalid link");
	}

	static InvalidResetLinkException unknown() {
		return new InvalidResetLinkException(UserRules.RESET_LINK_INVALID);
	}

	static InvalidResetLinkException used() {
		return new InvalidResetLinkException(UserRules.RESET_LINK_USED);
	}

	static InvalidResetLinkException expired() {
		return new InvalidResetLinkException(UserRules.RESET_LINK_EXPIRED);
	}
}
