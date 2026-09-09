package com.carbonos.ghg.internal.web.dto;

import java.util.UUID;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.LeaseType;
import com.carbonos.ghg.internal.Scope;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * A classification (spec 04.1): the factor plus the scope and category the
 * accountant chose. Absent, they default from the factor; with a lease type,
 * they derive from Appendix F under the inventory's approach.
 */
public record ClassifyRequest( //
		@NotNull UUID emissionFactorId, //
		Scope scope, //
		ActivityCategory category, //
		LeaseType leaseType, //
		// why the scope departs from the stream's or factor's default (spec 04.3)
		@Size(min = 10, max = 500) String scopeJustification, //
		Boolean proxy, //
		@Size(min = 5, max = 500) String proxyJustification, //
		// the density that converts a record in mass to a factor per litre, or the reverse (spec 02.2)
		UUID densityId) {
}
