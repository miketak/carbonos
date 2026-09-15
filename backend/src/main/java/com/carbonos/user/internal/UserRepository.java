package com.carbonos.user.internal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {

	Optional<User> findByEmail(String email);

	boolean existsByEmail(String email);

	long countByRoleAndStatus(UserRole role, UserStatus status);

	/** The administration panel's account counts (spec 01.5). */
	long countByStatus(UserStatus status);

	List<User> findAllByOrderByCreatedAtAsc();
}
