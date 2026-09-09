package com.carbonos.user.internal;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.carbonos.user.UserDirectory;

/** The public lookup over the users table (spec 01.2). */
@Component
class DbUserDirectory implements UserDirectory {

	private final UserRepository users;

	DbUserDirectory(UserRepository users) {
		this.users = users;
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<UserSummary> findByEmail(String email) {
		return users.findByEmail(UserService.normalize(email)).map(DbUserDirectory::summary);
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<UserSummary> findById(UUID id) {
		return users.findById(id).map(DbUserDirectory::summary);
	}

	private static UserSummary summary(User user) {
		return new UserSummary(user.getId(), user.getEmail(), user.getDisplayName(), user.getStatus().name());
	}
}
