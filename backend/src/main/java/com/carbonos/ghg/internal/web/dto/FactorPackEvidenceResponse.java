package com.carbonos.ghg.internal.web.dto;

import com.carbonos.ghg.internal.FactorPackPublication;

/**
 * The source document as it was stored (spec 02.5), with the SHA-256 computed
 * over the bytes received rather than a figure the caller stated.
 */
public record FactorPackEvidenceResponse(String key, String name, long size, String checksum) {

	public static FactorPackEvidenceResponse from(FactorPackPublication.Evidence evidence) {
		return new FactorPackEvidenceResponse(evidence.key(), evidence.name(), evidence.size(), evidence.checksum());
	}
}
