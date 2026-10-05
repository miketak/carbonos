package com.carbonos.ghg.internal;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;

/**
 * Whether two emission source names are close enough that the second is
 * probably the first typed again (spec 04.10). Pure and conservative: a near
 * miss is a prompt the user answers, never a silent match, so the test errs
 * towards prompting on "Kiln 1" against "Kiln 2" rather than missing
 * "Standby genset" against "Standby gensets".
 */
final class SourceNameSimilarity {

	/** Two or fewer edits when the shorter name has at least this many characters, else one. */
	static final int LONG_NAME = 8;

	/** What may be left over when one name is the other with a short suffix or prefix ("No. 2"). */
	static final int AFFIX_LEFTOVER = 5;

	private SourceNameSimilarity() {
	}

	/** Lower case, punctuation turned into spaces, whitespace collapsed. */
	static String normalize(String name) {
		return name.toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}\\s]", " ").trim().replaceAll("\\s+", " ");
	}

	/** True when the two names are the same once normalized, or a near miss of each other. */
	static boolean isClose(String a, String b) {
		var x = normalize(a);
		var y = normalize(b);
		if (x.equals(y)) {
			return true;
		}
		if (x.isEmpty() || y.isEmpty()) {
			return false;
		}
		var allowed = Math.min(x.length(), y.length()) >= LONG_NAME ? 2 : 1;
		if (distance(x, y) <= allowed) {
			return true;
		}
		var tx = List.of(x.split(" "));
		var ty = List.of(y.split(" "));
		if (new HashSet<>(tx).equals(new HashSet<>(ty))) {
			return true;
		}
		return oneTokenApart(tx, ty) || oneTokenVaried(tx, ty) || affixWithin(x, y);
	}

	/**
	 * The same words but one, and that word a near miss of its counterpart ("Camp
	 * generator diesel" and "Camp genset diesel"): two edits apart, or sharing
	 * their first three letters when both are real words.
	 */
	private static boolean oneTokenVaried(List<String> a, List<String> b) {
		if (a.size() != b.size()) {
			return false;
		}
		var restA = new ArrayList<>(a);
		var restB = new ArrayList<>(b);
		for (var token : a) {
			if (restB.remove(token)) {
				restA.remove(token);
			}
		}
		if (restA.size() != 1 || restB.size() != 1) {
			return false;
		}
		var p = restA.get(0);
		var q = restB.get(0);
		if (distance(p, q) <= 2) {
			return true;
		}
		return p.length() >= 4 && q.length() >= 4 && p.regionMatches(0, q, 0, 3);
	}

	/** One name is the other plus exactly one word, anywhere ("Grid supply" and "Plant grid supply"). */
	private static boolean oneTokenApart(List<String> a, List<String> b) {
		var longer = a.size() > b.size() ? a : b;
		var shorter = a.size() > b.size() ? b : a;
		if (longer.size() - shorter.size() != 1) {
			return false;
		}
		var rest = new ArrayList<>(longer);
		for (var token : shorter) {
			if (!rest.remove(token)) {
				return false;
			}
		}
		return rest.size() == 1;
	}

	/** One name starts or ends with the other and little is left over ("Boiler LPG" and "Boiler LPG No. 2"). */
	private static boolean affixWithin(String x, String y) {
		var longer = x.length() > y.length() ? x : y;
		var shorter = x.length() > y.length() ? y : x;
		if (!(longer.startsWith(shorter) || longer.endsWith(shorter))) {
			return false;
		}
		var leftover = longer.length() - shorter.length();
		return leftover <= AFFIX_LEFTOVER;
	}

	/** Optimal string alignment distance: insertions, deletions, substitutions and adjacent transpositions. */
	static int distance(String a, String b) {
		var d = new int[a.length() + 1][b.length() + 1];
		for (var i = 0; i <= a.length(); i++) {
			d[i][0] = i;
		}
		for (var j = 0; j <= b.length(); j++) {
			d[0][j] = j;
		}
		for (var i = 1; i <= a.length(); i++) {
			for (var j = 1; j <= b.length(); j++) {
				var cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
				d[i][j] = Math.min(Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1), d[i - 1][j - 1] + cost);
				if (i > 1 && j > 1 && a.charAt(i - 1) == b.charAt(j - 2) && a.charAt(i - 2) == b.charAt(j - 1)) {
					d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
				}
			}
		}
		return d[a.length()][b.length()];
	}
}
