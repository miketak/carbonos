package com.carbonos.ghg;

import java.math.BigDecimal;
import java.util.UUID;

/** Published when a calculation run finishes for an inventory. */
public record GhgRunCompleted(UUID runId, UUID inventoryId, BigDecimal totalKgCo2e) {
}
