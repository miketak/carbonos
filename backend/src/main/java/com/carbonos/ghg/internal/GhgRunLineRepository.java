package com.carbonos.ghg.internal;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GhgRunLineRepository extends JpaRepository<GhgRunLine, UUID> {

	boolean existsByActivityId(UUID activityId);

}
