package com.carbonos.ghg.internal;

import java.util.UUID;

import org.springframework.stereotype.Component;

/** The unit registry as one organization sees it: the shared units plus its own custom units (spec 02.2). */
@Component
public class OrganizationUnits {

	private final UnitConverter converter;
	private final CustomUnitRepository customUnits;

	OrganizationUnits(UnitConverter converter, CustomUnitRepository customUnits) {
		this.converter = converter;
		this.customUnits = customUnits;
	}

	public UnitConverter.Scoped forOrganization(UUID organizationId) {
		return converter.with(customUnits.findAllByOrganizationIdOrderByCodeAsc(organizationId));
	}
}
