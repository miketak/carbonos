package com.carbonos.help.internal;

import java.time.LocalDate;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface HelpSearchDayRepository extends JpaRepository<HelpSearchDay, LocalDate> {

	/** Counts a search on its day, and a miss when it found nothing (spec 09). */
	@Modifying
	@Query(value = """
			insert into help_search_days (day, searches, misses)
			values (:day, 1, :misses)
			on conflict (day) do update
			set searches = help_search_days.searches + 1, misses = help_search_days.misses + excluded.misses
			""", nativeQuery = true)
	void count(LocalDate day, int misses);

	@Query("select coalesce(sum(d.searches), 0L) from HelpSearchDay d where d.day >= :since")
	long searchesSince(LocalDate since);

	@Query("select coalesce(sum(d.misses), 0L) from HelpSearchDay d where d.day >= :since")
	long missesSince(LocalDate since);

	long deleteByDayBefore(LocalDate cutoff);

}
