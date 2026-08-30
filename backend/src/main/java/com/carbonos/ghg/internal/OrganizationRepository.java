package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {

	boolean existsByNameIgnoreCase(String name);

	List<Organization> findAllByOrderByCreatedAtAsc();

	List<Organization> findAllByOwnerUserIdOrderByCreatedAtAsc(UUID ownerUserId);
}
