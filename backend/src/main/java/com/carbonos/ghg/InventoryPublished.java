package com.carbonos.ghg;

import java.util.UUID;

/** Published when an inventory's report is issued (spec 05.1), for reporting and notification consumers. */
public record InventoryPublished(UUID inventoryId, UUID runId) {
}
