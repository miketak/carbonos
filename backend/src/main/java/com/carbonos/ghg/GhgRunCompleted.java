package com.carbonos.ghg;

import java.math.BigDecimal;
import java.util.UUID;

/** Published when an inventory calculation run finishes. */
public record GhgRunCompleted(UUID runId, UUID organizationId, BigDecimal totalKgCo2e) {
}
