package com.carbonos.ghg.internal.web.dto;

/** Why a frozen inventory is reopened (spec 05.5); the service refuses fewer than 10 characters with 422. */
public record ReopenRequest(String reason) {
}
