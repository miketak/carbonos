package com.carbonos.help.internal;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Turns a request into the voter hash that keeps one vote per voter per
 * article (spec 09): a salted SHA-256 of the session id when there is one and
 * of the client address otherwise. It identifies nobody, and no endpoint
 * returns it. The salt comes from {@code HELP_VOTER_SALT}; without it a random
 * one is drawn per boot, so deduplication then survives only until a restart.
 */
@Component
public class VoterHash {

	private static final Logger log = LoggerFactory.getLogger(VoterHash.class);

	private final String salt;

	VoterHash(HelpProperties properties) {
		if (properties.voterSalt() == null || properties.voterSalt().isBlank()) {
			var random = new byte[32];
			new SecureRandom().nextBytes(random);
			this.salt = HexFormat.of().formatHex(random);
			log.warn("HELP_VOTER_SALT is not set; help feedback uses a random salt for this boot, "
					+ "so one vote per voter per article holds only until the next restart");
		}
		else {
			this.salt = properties.voterSalt();
		}
	}

	public String of(HttpServletRequest request) {
		var session = request.getSession(false);
		return hash(session != null ? session.getId() : request.getRemoteAddr());
	}

	String hash(String key) {
		try {
			var digest = MessageDigest.getInstance("SHA-256");
			var bytes = digest.digest((salt + ':' + key).getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(bytes);
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("SHA-256 is unavailable", ex);
		}
	}
}
