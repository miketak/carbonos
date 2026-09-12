package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GhgAuditEventRepository extends JpaRepository<GhgAuditEvent, UUID> {

	List<GhgAuditEvent> findAllByInventoryIdOrderByCreatedAtDesc(UUID inventoryId);

	/** The organization-level acts (spec 01.3): support access and deletion, never an inventory's. */
	List<GhgAuditEvent> findAllByOrganizationIdAndInventoryIdIsNullOrderByCreatedAtDesc(UUID organizationId);
}
