package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityRevisionRepository extends JpaRepository<ActivityRevision, UUID> {

	List<ActivityRevision> findAllByActivityIdOrderByChangedAtDesc(UUID activityId);

	List<ActivityRevision> findAllByActivityIdIn(java.util.Collection<UUID> activityIds);
}
