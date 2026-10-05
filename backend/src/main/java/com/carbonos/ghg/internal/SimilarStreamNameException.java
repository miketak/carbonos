package com.carbonos.ghg.internal;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.carbonos.ghg.GhgRules;
import com.carbonos.shared.web.Rule;
import com.carbonos.shared.web.RuleViolation;

/**
 * The facility already has an emission source with this name, or one close to
 * it (spec 04.10): a 409 that lists each candidate with the classification its
 * records default to, so the form can offer "Use <name>" with one click. Under
 * {@link GhgRules#STREAM_NAME_SIMILAR} the request may be re-sent with a reason
 * that says why this is a separate source; under
 * {@link GhgRules#STREAM_NAME_DUPLICATE} it cannot, because the name is taken.
 * The client detects this refusal by the {@code candidates} property, not by the
 * status.
 */
class SimilarStreamNameException extends RuleViolation {

	SimilarStreamNameException(Rule rule, Facility facility, String name, List<SourceStream> candidates) {
		super(rule, "Emission source name in use", values(rule, facility, name, candidates));
		getBody().setProperty("candidates", candidates.stream()
			.map(stream -> Map.of("id", stream.getId().toString(), "name", stream.getName(), "kind",
					stream.getKind().name(), "defaultScope", stream.defaultScope().name(), "defaultCategory",
					stream.defaultCategory().name()))
			.toList());
	}

	/** The placeholders of each rule's message, in order of appearance. */
	private static Object[] values(Rule rule, Facility facility, String name, List<SourceStream> candidates) {
		var names = candidates.stream().map(stream -> "'" + stream.getName() + "'").collect(Collectors.joining(", "));
		if (rule == GhgRules.STREAM_NAME_SIMILAR) {
			return new Object[] { facility.getName(), names, name };
		}
		return new Object[] { facility.getName(), name };
	}
}
