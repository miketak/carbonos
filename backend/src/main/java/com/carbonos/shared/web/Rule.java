package com.carbonos.shared.web;

import org.springframework.http.HttpStatus;

/**
 * One refusal the product makes, named. The id is stable and what the QA
 * scenarios refer to; the message is what the product says, and may carry
 * {@code {placeholders}} the throw site fills in. {@code field} names the
 * form field the message belongs under when the refusal is a 422, else null.
 */
public record Rule(String id, HttpStatus status, String message, String field) {

	public Rule {
		if (id == null || id.isBlank()) {
			throw new IllegalArgumentException("a rule needs an id");
		}
		if (message == null || message.isBlank()) {
			throw new IllegalArgumentException("rule " + id + " needs a message");
		}
	}

	public static Rule of(String id, HttpStatus status, String message) {
		return new Rule(id, status, message, null);
	}

	public static Rule field(String id, String field, String message) {
		return new Rule(id, HttpStatus.UNPROCESSABLE_ENTITY, message, field);
	}

	/** The message with its placeholders filled in, in order of appearance. */
	public String format(Object... values) {
		var out = message;
		for (var value : values) {
			out = out.replaceFirst("\\{[a-zA-Z]+}", java.util.regex.Matcher.quoteReplacement(String.valueOf(value)));
		}
		return out;
	}
}
