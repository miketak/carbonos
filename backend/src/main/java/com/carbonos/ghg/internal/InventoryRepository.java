package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryRepository extends JpaRepository<Inventory, UUID> {

	/** The inventory a correction superseded, if any (spec 07.4: the version chain). */
	java.util.Optional<Inventory> findBySupersededById(UUID supersededById);

	List<Inventory> findAllByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

	/** The organization's inventories in one state, for the blast radius's open drafts (spec 02.5). */
	List<Inventory> findAllByOrganizationIdAndStatusOrderByPeriodStartAsc(UUID organizationId,
			InventoryStatus status);

	/**
	 * The organization's inventories in any of these states, which is how an
	 * import finds the locked periods that refuse it (spec 02.6).
	 */
	List<Inventory> findAllByOrganizationIdAndStatusInOrderByPeriodStartAsc(UUID organizationId,
			java.util.Collection<InventoryStatus> statuses);
}
