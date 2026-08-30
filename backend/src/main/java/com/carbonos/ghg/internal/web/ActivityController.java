package com.carbonos.ghg.internal.web;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.carbonos.ghg.internal.GhgService;
import com.carbonos.ghg.internal.web.dto.ActivityResponse;
import com.carbonos.ghg.internal.web.dto.CreateActivityRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/ghg")
class ActivityController {

	private final GhgService ghgService;

	ActivityController(GhgService ghgService) {
		this.ghgService = ghgService;
	}

	@GetMapping("/organizations/{organizationId}/activities")
	List<ActivityResponse> list(@PathVariable UUID organizationId) {
		return ghgService.listActivities(organizationId).stream().map(ActivityResponse::from).toList();
	}

	@PostMapping("/organizations/{organizationId}/activities")
	ResponseEntity<ActivityResponse> create(@PathVariable UUID organizationId,
			@Valid @RequestBody CreateActivityRequest body) {
		var activity = ghgService.createActivity(organizationId, body.facilityId(), body.activityType(),
				body.quantity(), body.unit(), body.activityDate(), body.dataSource(), body.evidenceRef(),
				body.dataQuality(), body.note());
		URI location = ServletUriComponentsBuilder.fromCurrentContextPath().path("/api/ghg/activities/{id}")
			.buildAndExpand(activity.getId()).toUri();
		return ResponseEntity.created(location).body(ActivityResponse.from(activity));
	}

	@PutMapping("/activities/{id}")
	ActivityResponse update(@PathVariable UUID id, @Valid @RequestBody CreateActivityRequest body) {
		return ActivityResponse.from(ghgService.updateActivity(id, body.facilityId(), body.activityType(),
				body.quantity(), body.unit(), body.activityDate(), body.dataSource(), body.evidenceRef(),
				body.dataQuality(), body.note()));
	}

	@DeleteMapping("/activities/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@PathVariable UUID id) {
		ghgService.deleteActivity(id);
	}
}
