package com.carbonos.user;

import java.util.UUID;

/** Published when a new user account is created. */
public record UserCreated(UUID id, String email) {
}
