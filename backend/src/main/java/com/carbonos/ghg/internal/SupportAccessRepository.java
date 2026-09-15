package com.carbonos.ghg.internal;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportAccessRepository extends JpaRepository<SupportAccess, UUID> {

	/** The caller's active grant on an organization, if any. */
	Optional<SupportAccess> findFirstByOrganizationIdAndAdminUserIdAndEndedAtIsNullAndExpiresAtAfter(
			UUID organizationId, UUID adminUserId, Instant now);

	/** The active grants on an organization, for its owners' overview. */
	List<SupportAccess> findAllByOrganizationIdAndEndedAtIsNullAndExpiresAtAfterOrderByGrantedAtAsc(
			UUID organizationId, Instant now);

	/** The organizations an administrator currently holds support access to. */
	List<SupportAccess> findAllByAdminUserIdAndEndedAtIsNullAndExpiresAtAfter(UUID adminUserId, Instant now);

	/** Every live grant on the platform, for the administration panel's access register (spec 01.5). */
	List<SupportAccess> findAllByEndedAtIsNullAndExpiresAtAfterOrderByExpiresAtAsc(Instant now);

	/** Grants that closed recently, so the register is a record rather than a list that empties (spec 01.5). */
	List<SupportAccess> findAllByGrantedAtAfterOrderByGrantedAtDesc(Instant since);

	/** Grants whose window ran out without being ended, for the expiry sweep. */
	List<SupportAccess> findAllByEndedAtIsNullAndExpiresAtLessThanEqual(Instant now);
}
