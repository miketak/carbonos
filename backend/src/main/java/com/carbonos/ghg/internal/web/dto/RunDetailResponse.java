package com.carbonos.ghg.internal.web.dto;

import java.util.List;

import com.carbonos.ghg.internal.GhgRun;

public record RunDetailResponse(RunResponse run, List<RunLineResponse> lines) {

	public static RunDetailResponse from(GhgRun run) {
		return new RunDetailResponse(RunResponse.from(run),
				run.getLines().stream().map(RunLineResponse::from).toList());
	}
}
