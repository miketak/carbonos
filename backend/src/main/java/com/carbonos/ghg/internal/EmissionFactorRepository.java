package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EmissionFactorRepository extends JpaRepository<EmissionFactor, UUID> {

	List<EmissionFactor> findAllByOrganizationIdIsNullOrderByDefaultScopeAscNameAsc();

	List<EmissionFactor> findAllByOrganizationIdIsNullOrOrganizationIdOrderByDefaultScopeAscNameAsc(UUID organizationId);

	List<EmissionFactor> findAllByOrganizationIdAndPack(UUID organizationId, String pack);
}
