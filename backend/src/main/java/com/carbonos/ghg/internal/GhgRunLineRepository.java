package com.carbonos.ghg.internal;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GhgRunLineRepository extends JpaRepository<GhgRunLine, UUID> {

	boolean existsByActivityId(UUID activityId);

	/** Which of these records a run has calculated (spec 04.6): their evidence stays on file. */
	@org.springframework.data.jpa.repository.Query("select distinct l.activityId from GhgRunLine l where l.activityId in :activityIds")
	java.util.Set<UUID> calculatedActivityIds(java.util.Collection<UUID> activityIds);

	boolean existsByFactorId(UUID factorId);

	/** The runs that calculated a record, for the refusal that names them (spec 04.11). */
	@org.springframework.data.jpa.repository.Query("select distinct l.run.runNo from GhgRunLine l where l.activityId = :activityId order by l.run.runNo")
	java.util.List<Integer> runNumbersOf(UUID activityId);

}
