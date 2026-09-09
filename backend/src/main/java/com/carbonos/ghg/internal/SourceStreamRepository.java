package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SourceStreamRepository extends JpaRepository<SourceStream, UUID> {

	@EntityGraph(attributePaths = "facility")
	List<SourceStream> findAllByFacilityIdOrderByNameAsc(UUID facilityId);

	@EntityGraph(attributePaths = "facility")
	List<SourceStream> findAllByFacilityOrganizationIdOrderByNameAsc(UUID organizationId);

	boolean existsByFacilityIdAndNameIgnoreCase(UUID facilityId, String name);
}
