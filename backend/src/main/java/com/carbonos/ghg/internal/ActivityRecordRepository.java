package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ActivityRecordRepository
		extends JpaRepository<ActivityRecord, UUID>, JpaSpecificationExecutor<ActivityRecord> {

	long countByFacilityOrganizationIdAndDeletedAtIsNull(UUID organizationId);

	// facility is rendered with each activity; fetch it eagerly because
	// open-in-view is off and mapping happens outside the transaction
	@EntityGraph(attributePaths = { "facility", "stream" })
	List<ActivityRecord> findAllByFacilityOrganizationIdAndDeletedAtIsNullOrderByPeriodEndDesc(UUID organizationId);

	boolean existsByFacilityIdAndDeletedAtIsNull(UUID facilityId);

	boolean existsByStreamIdAndDeletedAtIsNull(UUID streamId);

}
