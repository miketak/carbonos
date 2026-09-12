package com.carbonos.ghg.internal;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface EvidenceRepository extends JpaRepository<Evidence, UUID>, JpaSpecificationExecutor<Evidence> {

	List<Evidence> findAllByActivityIdOrderByUploadedAtAsc(UUID activityId);

	List<Evidence> findAllByMarketFactorIdOrderByUploadedAtAsc(UUID marketFactorId);

	List<Evidence> findAllByActivityIdIn(Collection<UUID> activityIds);

	long countByActivityId(UUID activityId);
}
