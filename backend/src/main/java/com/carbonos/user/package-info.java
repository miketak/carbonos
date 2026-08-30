/**
 * User accounts and authentication. Owns the {@code users} and
 * {@code access_requests} tables, session login, the admin-facing user CRUD
 * API, and the self-service access-request loop (spec 002). Public API:
 * {@link com.carbonos.user.AuthenticatedUser} (the session principal),
 * {@link com.carbonos.user.UserCreated},
 * {@link com.carbonos.user.AccessRequestApproved}, and
 * {@link com.carbonos.user.AccessRequestDenied} (domain events).
 */
package com.carbonos.user;
