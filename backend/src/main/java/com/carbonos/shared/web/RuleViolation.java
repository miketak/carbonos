package com.carbonos.shared.web;

import java.util.Map;

import org.springframework.web.ErrorResponseException;

/**
 * A refusal built from a {@link Rule}: the problem detail carries the rule's
 * message as {@code detail}, the field message under {@code errors} when the
 * rule names a field, and the rule id as the extension member {@code rule},
 * so a client (or a QA driver) can tell the refusal apart from its wording.
 */
public class RuleViolation extends ErrorResponseException {

	private final Rule rule;

	public RuleViolation(Rule rule, String title, Object... values) {
		super(rule.status());
		this.rule = rule;
		var message = rule.format(values);
		setTitle(title);
		setDetail(message);
		getBody().setProperty("rule", rule.id());
		if (rule.field() != null) {
			getBody().setProperty("errors", Map.of(rule.field(), message));
		}
	}

	/** A refusal not yet named by a rule; the problem detail carries no {@code rule} member. */
	protected RuleViolation(org.springframework.http.HttpStatus status, String title, String detail) {
		super(status);
		this.rule = null;
		setTitle(title);
		setDetail(detail);
	}

	/** The rule, or null for a refusal not yet named by one. */
	public Rule rule() {
		return rule;
	}
}
