package com.carbonos.ghg.internal;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GhgRunLineRepository extends JpaRepository<GhgRunLine, UUID> {

	boolean existsByActivityId(UUID activityId);

	/** Which of these records a run has calculated (spec 04.6): their evidence stays on file. */
	@org.springframework.data.jpa.repository.Query("select distinct l.activityId from GhgRunLine l where l.activityId in :activityIds")
	java.util.Set<UUID> calculatedActivityIds(java.util.Collection<UUID> activityIds);

	boolean existsByFactorId(UUID factorId);

}
