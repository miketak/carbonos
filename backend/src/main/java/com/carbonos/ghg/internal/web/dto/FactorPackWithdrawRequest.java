package com.carbonos.ghg.internal.web.dto;

import jakarta.validation.constraints.Size;

/**
 * Why an edition is withdrawn (spec 02.5). The service refuses anything under
 * ten characters with 422 {@code errors.reason}: it is the record a verifier
 * reads beside the figures that rest on the edition.
 */
public record FactorPackWithdrawRequest(@Size(max = 500) String reason) {
}
