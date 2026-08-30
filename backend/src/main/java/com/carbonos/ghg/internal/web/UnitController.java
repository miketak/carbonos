package com.carbonos.ghg.internal.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carbonos.ghg.internal.UnitConverter;
import com.carbonos.ghg.internal.web.dto.UnitResponse;

/** The convertible-unit registry, for the activity-entry picker and conversion previews. */
@RestController
@RequestMapping("/api/ghg/units")
class UnitController {

	private final UnitConverter units;

	UnitController(UnitConverter units) {
		this.units = units;
	}

	@GetMapping
	List<UnitResponse> list() {
		return units.all().stream().map(UnitResponse::from).toList();
	}
}
