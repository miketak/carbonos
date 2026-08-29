package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FacilityRepository extends JpaRepository<Facility, UUID> {

	List<Facility> findAllByOrganizationIdOrderByCreatedAtAsc(UUID organizationId);

	long countByOrganizationId(UUID organizationId);
}
