package com.carbonos.ghg.internal.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carbonos.ghg.internal.GhgService;
import com.carbonos.ghg.internal.web.dto.EmissionFactorResponse;

@RestController
@RequestMapping("/api/ghg/emission-factors")
class EmissionFactorController {

	private final GhgService ghgService;

	EmissionFactorController(GhgService ghgService) {
		this.ghgService = ghgService;
	}

	@GetMapping
	List<EmissionFactorResponse> list() {
		return ghgService.listEmissionFactors().stream().map(EmissionFactorResponse::from).toList();
	}
}
