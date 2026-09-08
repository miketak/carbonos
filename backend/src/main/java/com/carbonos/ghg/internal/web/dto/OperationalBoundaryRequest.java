package com.carbonos.ghg.internal.web.dto;

import java.util.List;

import com.carbonos.ghg.internal.ActivityCategory;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** The operational boundary declaration (spec 07.1): scope 3 categories covered and why the rest are not. */
public record OperationalBoundaryRequest( //
		@NotNull List<ActivityCategory> scope3Categories, //
		@Size(max = 1000) String exclusionsRationale) {
}
