package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryRepository extends JpaRepository<Inventory, UUID> {

	List<Inventory> findAllByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

}
