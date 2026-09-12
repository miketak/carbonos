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

	/** The facts: what inventories review, gates check and imports compare against; drafts stay out (spec 04.6). */
	@EntityGraph(attributePaths = { "facility", "stream" })
	List<ActivityRecord> findAllByOrganizationIdAndDeletedAtIsNullAndDraftFalseOrderByPeriodEndDesc(
			UUID organizationId);

	@EntityGraph(attributePaths = { "facility", "stream" })
	List<ActivityRecord> findAllByOrganizationIdAndDeletedAtIsNullAndDraftTrueOrderByCreatedAtAsc(
			UUID organizationId);

	boolean existsByFacilityIdAndDeletedAtIsNull(UUID facilityId);

	/** The first and last record number an import produced (spec 04.6), or nulls for none. */
	@org.springframework.data.jpa.repository.Query("select min(a.recordNo), max(a.recordNo) from ActivityRecord a where a.importBatchId = :batchId")
	List<Object[]> recordRange(UUID batchId);

	boolean existsByStreamIdAndDeletedAtIsNull(UUID streamId);

}
