package com.carbonos.qa.internal;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.stereotype.Service;

import com.carbonos.media.MediaStorage;
import com.carbonos.user.InitialAdmin;

/**
 * Brings a local stack back to what a fresh deployment gets: the schema and
 * seed rows the migrations create, an empty object store, no session, and
 * the administrator from {@code CARBONOS_ADMIN_EMAIL}. The backend keeps
 * running, so a driver's next request works without a restart.
 */
@Service
@ConditionalOnProperty(name = "carbonos.qa.endpoints", havingValue = "true")
class QaResetService {

	private static final Logger log = LoggerFactory.getLogger(QaResetService.class);

	private final Flyway flyway;
	private final JdbcTemplate jdbc;
	private final SessionRegistry sessions;
	private final MediaStorage media;
	private final InitialAdmin initialAdmin;

	QaResetService(Flyway flyway, JdbcTemplate jdbc, SessionRegistry sessions, MediaStorage media,
			InitialAdmin initialAdmin) {
		this.flyway = flyway;
		this.jdbc = jdbc;
		this.sessions = sessions;
		this.media = media;
		this.initialAdmin = initialAdmin;
	}

	void reset() {
		log.warn("QA reset: dropping the schema and replaying the migrations");
		for (var principal : sessions.getAllPrincipals()) {
			for (var session : sessions.getAllSessions(principal, true)) {
				session.expireNow();
			}
		}
		// the auto-configured Flyway refuses clean(); a copy of its configuration allows it
		var cleanable = Flyway.configure().configuration(flyway.getConfiguration()).cleanDisabled(false).load();
		cleanable.clean();
		cleanable.migrate();
		media.deleteAll();
		initialAdmin.seed();
	}

	/**
	 * A deterministic picture of the database: the row count of every table the
	 * migrations own, by name. Two stacks that walked the same procedure agree
	 * on it; a step that left something behind shows up as a count.
	 */
	Map<String, Long> counts() {
		var tables = jdbc.queryForList("""
				SELECT table_name FROM information_schema.tables
				WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
				  AND table_name NOT IN ('flyway_schema_history', 'event_publication', 'event_publication_archive')
				""", String.class);
		tables.sort(Comparator.naturalOrder());
		var counts = new LinkedHashMap<String, Long>();
		for (var table : tables) {
			counts.put(table, jdbc.queryForObject("SELECT count(*) FROM \"" + table + "\"", Long.class));
		}
		return counts;
	}
}
