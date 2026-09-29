package com.carbonos.user;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * The user module's public lookup, for other modules that hold a user id or
 * an email (spec 01.2: organization membership).
 */
public interface UserDirectory {

	/** An account as another module may know it; never the password hash. */
	record UserSummary(UUID id, String email, String displayName, String status) {
	}

	Optional<UserSummary> findByEmail(String email);

	Optional<UserSummary> findById(UUID id);

	/** The accounts among the ids that still exist, in no particular order; ids with no account are left out. */
	List<UserSummary> findAllByIds(Collection<UUID> ids);
}
