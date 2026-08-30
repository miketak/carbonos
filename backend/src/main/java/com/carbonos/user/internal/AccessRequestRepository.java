package com.carbonos.user.internal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AccessRequestRepository extends JpaRepository<AccessRequest, UUID> {

	Optional<AccessRequest> findBySetupToken(String setupToken);

	boolean existsByEmailAndStatus(String email, AccessRequestStatus status);

	List<AccessRequest> findAllByOrderByCreatedAtDesc();

}
