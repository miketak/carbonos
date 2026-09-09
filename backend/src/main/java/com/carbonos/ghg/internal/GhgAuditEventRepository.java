package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GhgAuditEventRepository extends JpaRepository<GhgAuditEvent, UUID> {

	List<GhgAuditEvent> findAllByInventoryIdOrderByCreatedAtDesc(UUID inventoryId);
}
