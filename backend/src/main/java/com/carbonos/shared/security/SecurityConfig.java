package com.carbonos.shared.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.core.session.SessionRegistryImpl;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.savedrequest.NullRequestCache;
import org.springframework.security.web.session.HttpSessionEventPublisher;

/**
 * Session-cookie security for the SPA. Depends only on framework types; the
 * {@code user} module contributes the {@code UserDetailsService} bean that
 * Spring wires into the authentication manager by type.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
class SecurityConfig {

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	SecurityContextRepository securityContextRepository() {
		return new HttpSessionSecurityContextRepository();
	}

	/**
	 * Which sessions belong to which account, so that a new password can end
	 * the others (spec 01.9). In memory, like the sessions themselves.
	 */
	@Bean
	SessionRegistry sessionRegistry() {
		return new SessionRegistryImpl();
	}

	/** Tells the registry when the container destroys a session or changes its id. */
	@Bean
	HttpSessionEventPublisher httpSessionEventPublisher() {
		return new HttpSessionEventPublisher();
	}

	@Bean
	AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
		return configuration.getAuthenticationManager();
	}

	@Bean
	SecurityFilterChain filterChain(HttpSecurity http, ProblemDetailAuthErrorWriter authErrorWriter,
			SessionRegistry sessionRegistry) throws Exception {
		http
			.authorizeHttpRequests(auth -> auth
				.requestMatchers("/actuator/health/**").permitAll()
				.requestMatchers("/api/auth/login").permitAll()
				.requestMatchers(HttpMethod.POST, "/api/access-requests").permitAll()
				.requestMatchers("/api/access-requests/setup/*").permitAll()
				.requestMatchers(HttpMethod.POST, "/api/access-requests/complete").permitAll()
				// spec 01.9: ask for a reset link, read one, and use it; CSRF still applies to the POSTs
				.requestMatchers(HttpMethod.POST, "/api/auth/password-reset").permitAll()
				.requestMatchers(HttpMethod.GET, "/api/auth/password-reset/*").permitAll()
				.requestMatchers(HttpMethod.POST, "/api/auth/password-reset/complete").permitAll()
				// spec 09: a visitor may vote on a help article and report a search; CSRF still applies
				.requestMatchers(HttpMethod.POST, "/api/help/**").permitAll()
				.requestMatchers("/api/admin/**").hasRole("ADMIN")
				.anyRequest().authenticated())
			.csrf(csrf -> csrf
				.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
				.csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler()))
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
				// no cap on sessions per account; the registry only lets a new password end the others,
				// and an ended session's next request gets the same 401 as a missing one
				.maximumSessions(-1)
				.sessionRegistry(sessionRegistry)
				.expiredSessionStrategy(event -> authErrorWriter.commence(event.getRequest(), event.getResponse(), null)))
			.requestCache(cache -> cache.requestCache(new NullRequestCache()))
			.exceptionHandling(exceptions -> exceptions
				.authenticationEntryPoint(authErrorWriter)
				.accessDeniedHandler(authErrorWriter))
			.formLogin(AbstractHttpConfigurer::disable)
			.httpBasic(AbstractHttpConfigurer::disable)
			.logout(AbstractHttpConfigurer::disable);
		return http.build();
	}
}
