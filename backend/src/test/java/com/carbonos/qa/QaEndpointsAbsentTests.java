package com.carbonos.qa;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

import com.carbonos.TestcontainersConfiguration;
import com.carbonos.user.AuthenticatedUser;

/** Without the property, the module contributes no bean and {@code /api/qa/**} is nothing at all. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class QaEndpointsAbsentTests {

	@Autowired
	ApplicationContext context;

	@Autowired
	MockMvc mvc;

	@Test
	void noQaBeanWithoutTheProperty() throws Exception {
		assertThat(context.getBeanNamesForType(Object.class)).noneMatch(name -> name.startsWith("qa"));
		mvc.perform(get("/api/qa/rules")
			.with(user(new AuthenticatedUser(UUID.randomUUID(), "admin@example.test", "n/a", "ADMIN", true))))
			.andExpect(status().isNotFound());
	}
}
