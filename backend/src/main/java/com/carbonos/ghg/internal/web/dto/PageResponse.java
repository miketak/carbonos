package com.carbonos.ghg.internal.web.dto;

import java.util.List;

/** One page of a register (spec 04.5): the items, the page asked for, its size and the total that matches. */
public record PageResponse<T>(List<T> items, int page, int size, long total) {
}
