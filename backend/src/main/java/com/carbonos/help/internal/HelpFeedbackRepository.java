package com.carbonos.help.internal;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface HelpFeedbackRepository extends JpaRepository<HelpFeedback, Long>, JpaSpecificationExecutor<HelpFeedback> {

	/** One article's tally, for the pages listing and the below-target picks. */
	interface PageStats {

		String getPageSlug();

		long getVotes();

		long getHelpful();

		Instant getLastVoteAt();

	}

	/**
	 * Records a vote, replacing the voter's earlier one on the same article
	 * (spec 09). One statement rather than find-then-save, so two votes racing
	 * from the same browser cannot both insert and trip the unique constraint.
	 */
	@Modifying
	@Query(value = """
			insert into help_feedback (page_slug, helpful, reason, comment, voter_hash, created_at)
			values (:pageSlug, :helpful, :reason, :comment, :voterHash, :at)
			on conflict (page_slug, voter_hash) do update
			set helpful = excluded.helpful, reason = excluded.reason, comment = excluded.comment,
			    created_at = excluded.created_at
			""", nativeQuery = true)
	void upsert(String pageSlug, boolean helpful, String reason, String comment, String voterHash, Instant at);

	long countByCreatedAtGreaterThanEqual(Instant since);

	long countByHelpfulTrueAndCreatedAtGreaterThanEqual(Instant since);

	/** Every article with a vote, most voted first. */
	@Query("""
			select f.pageSlug as pageSlug, count(f) as votes,
			       sum(case when f.helpful = true then 1 else 0 end) as helpful,
			       max(f.createdAt) as lastVoteAt
			from HelpFeedback f
			group by f.pageSlug
			order by count(f) desc, f.pageSlug
			""")
	List<PageStats> pageStats();

	long deleteByCreatedAtBefore(Instant cutoff);

}
