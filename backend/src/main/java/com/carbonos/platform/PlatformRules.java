package com.carbonos.platform;

import java.util.List;

import org.springframework.stereotype.Component;

import com.carbonos.shared.web.Rule;
import com.carbonos.shared.web.RuleSource;

/** The refusals the {@code platform} module makes, named for the QA scenarios (spec 01.5). */
@Component
public class PlatformRules implements RuleSource {

	public static final Rule SUPPORT_WINDOW_RANGE = Rule.field("platform.support-window.range",
			"supportAccessWindowHours", "Support access lasts between {min} and {max} hours.");

	public static final Rule NOTHING_CHANGED = Rule.field("platform.nothing-changed", "reason",
			"Nothing changed, so there is nothing to record.");

	public static final Rule REASON_TOO_SHORT = Rule.field("platform.reason-too-short", "reason",
			"Give a reason of at least {min} characters.");

	private static final List<Rule> ALL = List.of(SUPPORT_WINDOW_RANGE, NOTHING_CHANGED, REASON_TOO_SHORT);

	@Override
	public String module() {
		return "platform";
	}

	@Override
	public List<Rule> rules() {
		return ALL;
	}
}
