package com.carbonos.user;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import com.carbonos.shared.web.Rule;
import com.carbonos.shared.web.RuleSource;

/** The refusals the {@code user} module makes, named for the QA scenarios (specs 01, 01.1, 01.9). */
@Component
public class UserRules implements RuleSource {

	public static final String PASSWORD_RULE = "At least 12 characters, with a letter and a digit.";

	public static final Rule PASSWORD_WEAK = Rule.field("user.password.weak", "password", PASSWORD_RULE);

	/** The profile's change names its field {@code newPassword} (spec 01.9). */
	public static final Rule NEW_PASSWORD_WEAK = Rule.field("user.password.weak", "newPassword", PASSWORD_RULE);

	public static final Rule PASSWORD_SAME = Rule.field("user.password.same", "newPassword",
			"Choose a password different from your current one.");

	public static final Rule CURRENT_PASSWORD_WRONG = Rule.field("user.password.current-wrong", "currentPassword",
			"The current password is not correct.");

	public static final Rule CREDENTIALS_INVALID = Rule.of("user.credentials.invalid", HttpStatus.UNAUTHORIZED,
			"Invalid email or password.");

	public static final Rule EMAIL_DUPLICATE = Rule.of("user.email.duplicate", HttpStatus.CONFLICT,
			"A user with email '{email}' already exists.");

	public static final Rule SELF_DEMOTE_OR_DISABLE = Rule.of("user.self.demote-or-disable", HttpStatus.CONFLICT,
			"You cannot demote or disable your own account.");

	public static final Rule SELF_DELETE = Rule.of("user.self.delete", HttpStatus.CONFLICT,
			"You cannot delete your own account.");

	public static final Rule LAST_ADMINISTRATOR = Rule.of("user.last-administrator", HttpStatus.CONFLICT,
			"At least one active administrator must remain.");

	public static final Rule RESET_PENDING_ACCOUNT = Rule.of("user.reset.pending-account", HttpStatus.CONFLICT,
			"This account has not set its first password yet; the link in its approval email still works.");

	public static final Rule RESET_DISABLED_ACCOUNT = Rule.of("user.reset.disabled-account", HttpStatus.CONFLICT,
			"Enable the account before sending a password reset link.");

	public static final Rule ACCESS_REQUEST_DUPLICATE = Rule.of("access-request.duplicate", HttpStatus.CONFLICT,
			"An account or pending request already exists for '{email}'.");

	public static final Rule ACCESS_REQUEST_DECIDED = Rule.of("access-request.already-decided", HttpStatus.CONFLICT,
			"This request was already decided ({status}).");

	public static final Rule SETUP_LINK_INVALID = Rule.of("access-request.setup-link.invalid", HttpStatus.NOT_FOUND,
			"This link is invalid or has expired.");

	public static final Rule RESET_LINK_INVALID = Rule.of("password-reset.link.invalid", HttpStatus.NOT_FOUND,
			"This reset link is not valid.");

	public static final Rule RESET_LINK_USED = Rule.of("password-reset.link.used", HttpStatus.GONE,
			"This reset link has already been used.");

	public static final Rule RESET_LINK_EXPIRED = Rule.of("password-reset.link.expired", HttpStatus.GONE,
			"This reset link has expired. Reset links are valid for 1 hour.");

	private static final List<Rule> ALL = List.of(PASSWORD_WEAK, PASSWORD_SAME, CURRENT_PASSWORD_WRONG,
			CREDENTIALS_INVALID, EMAIL_DUPLICATE, SELF_DEMOTE_OR_DISABLE, SELF_DELETE, LAST_ADMINISTRATOR,
			RESET_PENDING_ACCOUNT, RESET_DISABLED_ACCOUNT, ACCESS_REQUEST_DUPLICATE, ACCESS_REQUEST_DECIDED,
			SETUP_LINK_INVALID, RESET_LINK_INVALID, RESET_LINK_USED, RESET_LINK_EXPIRED);

	@Override
	public String module() {
		return "user";
	}

	@Override
	public List<Rule> rules() {
		return ALL;
	}
}
