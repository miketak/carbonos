package com.carbonos.ghg.internal.web.dto;

import java.util.UUID;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.LeaseType;
import com.carbonos.ghg.internal.Scope;

import jakarta.validation.constraints.NotNull;

/**
 * A classification (spec 04.1): the factor plus the scope and category the
 * accountant chose. Absent, they default from the factor; with a lease type,
 * they derive from Appendix F under the inventory's approach.
 */
public record ClassifyRequest( //
		@NotNull UUID emissionFactorId, //
		Scope scope, //
		ActivityCategory category, //
		LeaseType leaseType) {
}
