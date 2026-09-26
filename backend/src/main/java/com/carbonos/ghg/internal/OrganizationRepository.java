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

	/** The live organizations carrying the name, oldest first (spec 01.8); a removed one never counts. */
	List<Organization> findAllByNameIgnoreCaseAndDeletedAtIsNullOrderByAccountNoAsc(String name);

	/** The next account number (spec 01.8): taken once per creation, after every check, never reused. */
	@Query(value = "select nextval('ghg_organizations_account_no_seq')", nativeQuery = true)
	long nextAccountNo();

	/** Every live organization, for the administrators' support list (spec 01.3). */
	List<Organization> findAllByDeletedAtIsNullOrderByCreatedAtAsc();

	/** Live organizations only: a tombstone is not a client (spec 01.5). */
	long countByDeletedAtIsNull();
}
