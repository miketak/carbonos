package com.carbonos.ghg.internal;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityRecordRepository extends JpaRepository<ActivityRecord, UUID> {

	// facility and factor are rendered with each activity; fetch them eagerly
	// because open-in-view is off and mapping happens outside the transaction
	@EntityGraph(attributePaths = { "facility", "emissionFactor" })
	List<ActivityRecord> findAllByFacilityOrganizationIdOrderByActivityDateDesc(UUID organizationId);

	@EntityGraph(attributePaths = { "facility", "emissionFactor" })
	List<ActivityRecord> findAllByFacilityOrganizationIdAndActivityDateBetween(UUID organizationId, LocalDate start,
			LocalDate end);
}
