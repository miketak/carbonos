package com.carbonos.ghg.internal;

import java.util.List;

/**
 * The eight Scope 2 Quality Criteria a contractual instrument is tested
 * against (Scope 2 Guidance, chapter 7; spec 07.6), answered one at a time.
 * Criteria 1 to 6 shorten Table 7.1 of the Guidance; 7 and 8 restate its
 * residual-mix and documentation requirements.
 */
public enum Scope2Criterion {

	CONVEYS_ATTRIBUTE("Conveys the GHG emission rate attribute of the generation it represents"),
	UNIQUE_CLAIM("Is the only instrument carrying that attribute claim for the generation (no double counting)"),
	RETIRED_FOR_COMPANY("Is tracked and redeemed, retired or cancelled by or on behalf of the reporting company"),
	VINTAGE_MATCHES("Is issued and redeemed as close as possible to the period of consumption it is applied to"),
	SAME_MARKET("Is sourced from the same market as the consuming operations it is applied to"),
	SUPPLIER_FACTOR_NET("For a supplier-specific factor: rests on delivered electricity net of certificates sold and inclusive of those retired for customers"),
	RESIDUAL_MIX_FOR_BALANCE("Untracked electricity in the same market takes a residual mix where one is published"),
	DOCUMENTED("Contract or certificate references, quantity, vintage and retirement are held as evidence");

	private final String title;

	Scope2Criterion(String title) {
		this.title = title;
	}

	public String title() {
		return title;
	}

	/** One answer per criterion: met, not met, or not yet answered. */
	public enum Answer {
		MET('Y'), NOT_MET('N'), UNANSWERED('U');

		private final char code;

		Answer(char code) {
			this.code = code;
		}

		static Answer of(char code) {
			for (var answer : values()) {
				if (answer.code == code) {
					return answer;
				}
			}
			return UNANSWERED;
		}

		static Answer of(Boolean value) {
			return value == null ? UNANSWERED : value ? MET : NOT_MET;
		}
	}

	/** Eight answers as the stored string, Y, N or U per criterion. */
	static String encode(List<Boolean> answers) {
		var out = new StringBuilder();
		for (int i = 0; i < values().length; i++) {
			var value = answers == null || i >= answers.size() ? null : answers.get(i);
			out.append(Answer.of(value).code);
		}
		return out.toString();
	}

	static List<Answer> decode(String stored) {
		var answers = new java.util.ArrayList<Answer>();
		for (int i = 0; i < values().length; i++) {
			answers.add(stored == null || i >= stored.length() ? Answer.UNANSWERED : Answer.of(stored.charAt(i)));
		}
		return List.copyOf(answers);
	}
}
