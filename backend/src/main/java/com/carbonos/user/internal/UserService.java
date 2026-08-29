package com.carbonos.user.internal;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carbonos.user.UserCreated;

@Service
@Transactional
public class UserService {

	private final UserRepository users;
	private final PasswordEncoder passwordEncoder;
	private final ApplicationEventPublisher events;

	UserService(UserRepository users, PasswordEncoder passwordEncoder, ApplicationEventPublisher events) {
		this.users = users;
		this.passwordEncoder = passwordEncoder;
		this.events = events;
	}

	@Transactional(readOnly = true)
	public List<User> list() {
		return users.findAllByOrderByCreatedAtAsc();
	}

	@Transactional(readOnly = true)
	public User get(UUID id) {
		return users.findById(id).orElseThrow(() -> new UserNotFoundException(id));
	}

	public User create(String email, String displayName, UserRole role, String rawPassword) {
		var normalizedEmail = normalize(email);
		if (users.existsByEmail(normalizedEmail)) {
			throw new DuplicateEmailException(normalizedEmail);
		}
		var user = new User(normalizedEmail, displayName, role, passwordEncoder.encode(rawPassword));
		try {
			user = users.saveAndFlush(user);
		}
		catch (DataIntegrityViolationException ex) {
			// unique-constraint race between existsByEmail and the insert
			throw new DuplicateEmailException(normalizedEmail);
		}
		events.publishEvent(new UserCreated(user.getId(), user.getEmail()));
		return user;
	}

	public User update(UUID id, String displayName, UserRole role, UserStatus status, UUID actorId) {
		var user = get(id);
		var losesAdminAccess = user.getRole() == UserRole.ADMIN && user.getStatus() == UserStatus.ACTIVE
				&& (role != UserRole.ADMIN || status != UserStatus.ACTIVE);
		if (losesAdminAccess && user.getId().equals(actorId)) {
			throw new UserRuleViolationException("You cannot demote or disable your own account.");
		}
		if (losesAdminAccess && isLastActiveAdmin()) {
			throw new UserRuleViolationException("At least one active administrator must remain.");
		}
		user.setDisplayName(displayName);
		user.setRole(role);
		user.setStatus(status);
		return user;
	}

	public void delete(UUID id, UUID actorId) {
		var user = get(id);
		if (user.getId().equals(actorId)) {
			throw new UserRuleViolationException("You cannot delete your own account.");
		}
		if (user.getRole() == UserRole.ADMIN && user.getStatus() == UserStatus.ACTIVE && isLastActiveAdmin()) {
			throw new UserRuleViolationException("At least one active administrator must remain.");
		}
		users.delete(user);
	}

	private boolean isLastActiveAdmin() {
		return users.countByRoleAndStatus(UserRole.ADMIN, UserStatus.ACTIVE) <= 1;
	}

	public static String normalize(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}
}
