package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomUnitRepository extends JpaRepository<CustomUnit, UUID> {

	List<CustomUnit> findAllByOrganizationIdOrderByCodeAsc(UUID organizationId);

	boolean existsByOrganizationIdAndCodeIgnoreCase(UUID organizationId, String code);
}
