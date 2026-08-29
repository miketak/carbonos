package com.carbonos.user.internal.bootstrap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.carbonos.user.internal.UserRepository;
import com.carbonos.user.internal.UserRole;
import com.carbonos.user.internal.UserService;

/**
 * Idempotent initial-admin seeder. Creates an active ADMIN from
 * CARBONOS_ADMIN_EMAIL / CARBONOS_ADMIN_PASSWORD when both are set and the
 * email is not taken; otherwise does nothing. Safe to run on every boot.
 */
@Component
class AdminBootstrap implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

	private final UserService userService;
	private final UserRepository users;
	private final String email;
	private final String password;

	AdminBootstrap(UserService userService, UserRepository users,
			@Value("${carbonos.admin.email:}") String email,
			@Value("${carbonos.admin.password:}") String password) {
		this.userService = userService;
		this.users = users;
		this.email = email;
		this.password = password;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (email.isBlank() || password.isBlank()) {
			return;
		}
		var normalized = UserService.normalize(email);
		if (users.findByEmail(normalized).isPresent()) {
			log.debug("Admin bootstrap: user {} already exists, nothing to do", normalized);
			return;
		}
		userService.create(normalized, "Admin", UserRole.ADMIN, password);
		log.info("Admin bootstrap: created initial admin {}", normalized);
	}
}
