package com.carbonos.ghg.internal.web.dto;

import java.util.UUID;

import com.carbonos.ghg.internal.UpstreamRuleKind;

import jakarta.validation.constraints.NotNull;

/** A rule that derives category 3 lines from the lines a primary factor already produces (spec 04.7). */
public record UpstreamRuleRequest(@NotNull UUID primaryFactorId, @NotNull UUID upstreamFactorId,
		@NotNull UpstreamRuleKind kind) {
}
