package com.carbonos.user.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSecurityEventRepository extends JpaRepository<UserSecurityEvent, UUID> {

	List<UserSecurityEvent> findByUserIdOrderByCreatedAtAsc(UUID userId);
}
