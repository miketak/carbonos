package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

	long countByStreamIdAndDeletedAtIsNull(UUID streamId);

	/** The live records per source of an organization, for the register's record counts (spec 04.10). */
	@Query("select a.stream.id, count(a) from ActivityRecord a where a.stream.facility.organization.id = :organizationId"
			+ " and a.deletedAt is null group by a.stream.id")
	List<Object[]> countByStreamOfOrganization(@Param("organizationId") UUID organizationId);

}
