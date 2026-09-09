package com.carbonos.user.internal;

/**
 * The password rule applied wherever a password is set (spec 01.2): at least
 * 12 characters with a letter and a digit. One place, so the administrator's
 * form and the set-password page cannot drift apart.
 */
public final class PasswordPolicy {

	public static final int MIN_LENGTH = 12;
	public static final String RULE = "At least 12 characters, with a letter and a digit.";

	private PasswordPolicy() {
	}

	public static boolean accepts(String password) {
		if (password == null || password.length() < MIN_LENGTH || password.length() > 72) {
			return false;
		}
		var letter = password.chars().anyMatch(Character::isLetter);
		var digit = password.chars().anyMatch(Character::isDigit);
		return letter && digit;
	}
}
