package com.carbonos.user.internal;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

	Optional<PasswordResetToken> findByTokenHash(String tokenHash);

	/** Voids every open link of the account: a new password makes them all stale. */
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("update PasswordResetToken t set t.usedAt = :now where t.userId = :userId and t.usedAt is null")
	int voidOpenLinks(UUID userId, Instant now);
}
