package com.carbonos.shared.web;

import java.util.List;

/**
 * A module's catalogue of {@link Rule}s. Each module that names its refusals
 * registers one bean; the {@code qa} module aggregates them into the rule
 * catalogue the QA scenarios are checked against.
 */
public interface RuleSource {

	/** The module the rules belong to, for the catalogue. */
	String module();

	List<Rule> rules();
}
