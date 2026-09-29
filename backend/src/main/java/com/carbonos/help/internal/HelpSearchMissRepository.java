package com.carbonos.help.internal;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface HelpSearchMissRepository extends JpaRepository<HelpSearchMiss, String> {

	/** Counts a miss, creating the row on its first sighting (spec 09). */
	@Modifying
	@Query(value = """
			insert into help_search_misses (query_normalized, count, first_seen, last_seen)
			values (:query, 1, :at, :at)
			on conflict (query_normalized) do update
			set count = help_search_misses.count + 1, last_seen = excluded.last_seen
			""", nativeQuery = true)
	void upsert(String query, Instant at);

	/** The most frequent misses; ties go to the most recent. */
	List<HelpSearchMiss> findAllByOrderByCountDescLastSeenDesc(Pageable pageable);

	long deleteByLastSeenBefore(Instant cutoff);

}
