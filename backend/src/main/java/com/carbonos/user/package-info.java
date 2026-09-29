/**
 * User accounts and authentication. Owns the {@code users},
 * {@code access_requests}, {@code password_reset_tokens} and
 * {@code user_security_events} tables, session login, the admin-facing user
 * CRUD API, the self-service access-request loop (spec 01.1), and changing
 * and resetting a password (spec 01.9). Public API:
 * {@link com.carbonos.user.AuthenticatedUser} (the session principal),
 * {@link com.carbonos.user.UserDirectory} (account lookup for other modules),
 * {@link com.carbonos.user.UserCreated},
 * {@link com.carbonos.user.AccessRequestApproved},
 * {@link com.carbonos.user.AccessRequestDenied},
 * {@link com.carbonos.user.PasswordResetRequested}, and
 * {@link com.carbonos.user.PasswordChanged} (domain events).
 */
package com.carbonos.user;
