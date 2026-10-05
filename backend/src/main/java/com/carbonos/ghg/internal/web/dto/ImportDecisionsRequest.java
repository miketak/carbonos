package com.carbonos.ghg.internal.web.dto;

import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityImportService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * The decisions on the emission source names the file has and the facility does
 * not (spec 04.11), sent with the file: each name as typed is mapped to an
 * existing source of the facility or created, with a reason where the preview
 * did not suggest the source. {@code sha256} is the preview's digest of the
 * file, so a decision set cannot be committed against another file.
 */
public record ImportDecisionsRequest(@Size(max = 64) String sha256, @Valid List<Item> items) {

	public record Item(@NotNull UUID facilityId, @NotBlank @Size(max = 120) String name, UUID mapTo,
			@Valid SourceStreamRequest create, @Size(max = 500) String reason) {
	}

	public ActivityImportService.Decisions toDecisions() {
		return new ActivityImportService.Decisions(sha256, items == null ? List.of()
				: items.stream()
					.map(item -> new ActivityImportService.Decision(item.facilityId(), item.name(), item.mapTo(),
							item.create() == null ? null : item.create().toFacts(), item.reason()))
					.toList());
	}
}
