package com.carbonos.ghg.internal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import jakarta.persistence.LockModeType;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {

	/** The organization row-locked, for taking record numbers (spec 04.6). */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select o from Organization o where o.id = :id")
	Optional<Organization> lockById(UUID id);

	/** Whether a live organization carries the name; a removed one has released it (spec 01.3). */
	boolean existsByNameIgnoreCaseAndDeletedAtIsNull(String name);

	/** Every live organization, for the administrators' support list (spec 01.3). */
	List<Organization> findAllByDeletedAtIsNullOrderByCreatedAtAsc();
}
