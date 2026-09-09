package com.carbonos.ghg.internal.web.dto;

import java.util.List;

import com.carbonos.ghg.internal.InventoryService;

/** One page of the activity view with the counts by status (spec 04.5). */
public record AssignmentPageResponse(List<AssignmentResponse> items, int page, int size, long total, long included,
		long excluded, long unclassified) {

	public static AssignmentPageResponse from(InventoryService.AssignmentPage page,
			java.util.Map<java.util.UUID, InventoryService.Suggestion> suggestions,
			java.util.Map<java.util.UUID, InventoryService.PublishedFact> published) {
		return new AssignmentPageResponse(page.items()
			.stream()
			.map(a -> AssignmentResponse.from(a, suggestions.get(a.getId()),
					published.isEmpty() ? null : published.get(a.getActivity().getId())))
			.toList(), page.page(),
				page.size(), page.total(), page.included(), page.excluded(), page.unclassified());
	}
}
