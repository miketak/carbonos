package com.carbonos.qa.internal;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.carbonos.shared.web.RuleSource;

/**
 * The QA hooks. Under {@code /api/qa/**}, which the security filter reserves
 * for the ADMIN platform role; present only with {@code carbonos.qa.endpoints=true}.
 */
@RestController
@RequestMapping("/api/qa")
@ConditionalOnProperty(name = "carbonos.qa.endpoints", havingValue = "true")
class QaController {

	/** One rule of the catalogue, as {@code qa/src/vocabulary/rules/catalogue.json} stores it. */
	record RuleEntry(String id, String module, int status, String message, String field) {
	}

	record Catalogue(List<RuleEntry> rules, String sha256) {
	}

	record Digest(Map<String, Long> counts, String sha256) {
	}

	private final List<RuleSource> sources;
	private final QaResetService reset;

	QaController(List<RuleSource> sources, QaResetService reset) {
		this.sources = sources;
		this.reset = reset;
	}

	/** Every named refusal, sorted by id, with a hash the driver compares against its committed copy. */
	@GetMapping("/rules")
	Catalogue rules() {
		var entries = sources.stream()
			.flatMap(source -> source.rules()
				.stream()
				.map(rule -> new RuleEntry(rule.id(), source.module(), rule.status().value(), rule.message(),
						rule.field())))
			.distinct()
			.sorted(java.util.Comparator.comparing(RuleEntry::id))
			.toList();
		var text = entries.stream()
			.map(e -> e.id() + "\t" + e.module() + "\t" + e.status() + "\t" + e.message() + "\t" + e.field())
			.reduce("", (a, b) -> a + b + "\n");
		return new Catalogue(entries, sha256(text));
	}

	@PostMapping("/reset")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void reset() {
		reset.reset();
	}

	@GetMapping("/digest")
	Digest digest() {
		var counts = reset.counts();
		var text = counts.entrySet().stream().map(e -> e.getKey() + "=" + e.getValue()).reduce("",
				(a, b) -> a + b + "\n");
		return new Digest(counts, sha256(text));
	}

	static String sha256(String text) {
		try {
			return HexFormat.of()
				.formatHex(MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8)));
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("SHA-256 is part of every Java runtime", ex);
		}
	}
}
