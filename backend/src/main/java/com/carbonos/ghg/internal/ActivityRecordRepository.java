package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityRecordRepository extends JpaRepository<ActivityRecord, UUID> {

	// facility is rendered with each activity; fetch it eagerly because
	// open-in-view is off and mapping happens outside the transaction
	@EntityGraph(attributePaths = "facility")
	List<ActivityRecord> findAllByFacilityOrganizationIdOrderByActivityDateDesc(UUID organizationId);

	boolean existsByFacilityId(UUID facilityId);

}
