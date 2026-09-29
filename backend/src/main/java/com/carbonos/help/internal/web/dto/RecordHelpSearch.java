package com.carbonos.help.internal.web.dto;

import jakarta.validation.constraints.NotNull;

/**
 * A search report (spec 09): whether it found anything, and what was typed
 * when it did not. The query of a hit is never stored, so it may be left out.
 */
public record RecordHelpSearch(@NotNull Boolean hit, String query) {
}
