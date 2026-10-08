package com.carbonos.user.internal.web.dto;

import com.carbonos.user.internal.DateFormat;

import jakarta.validation.constraints.NotNull;

/** Spec 01.10: the one preference so far; an unknown value fails to bind, a missing one fails validation. */
public record UpdatePreferencesRequest(@NotNull(message = "Choose a date format.") DateFormat dateFormat) {
}
