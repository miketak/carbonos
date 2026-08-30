package com.carbonos.user.internal.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carbonos.user.AuthenticatedUser;
import com.carbonos.user.internal.UserRepository;
import com.carbonos.user.internal.UserStatus;

@Service
class DbUserDetailsService implements UserDetailsService {

	private final UserRepository users;

	DbUserDetailsService(UserRepository users) {
		this.users = users;
	}

	@Override
	@Transactional(readOnly = true)
	public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
		return users.findByEmail(email)
			.map(user -> new AuthenticatedUser(user.getId(), user.getEmail(), user.getPasswordHash(),
					user.getRole().name(), user.getStatus() == UserStatus.ACTIVE))
			.orElseThrow(() -> new UsernameNotFoundException("No user with email " + email));
	}
}
