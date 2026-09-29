package com.carbonos;

import java.util.List;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

/**
 * Enforces the modular-monolith architecture. Fails the build when a module
 * reaches into another module's internals or a dependency cycle appears.
 */
class ModularityTests {

	static final ApplicationModules modules = ApplicationModules.of(CarbonosApplication.class);

	@Test
	void verifiesModularStructure() {
		modules.verify();
	}

	/**
	 * The {@code platform} module holds the deployment's policy and {@code ghg}
	 * reads it (spec 01.5), so anything it read back from {@code ghg} would be
	 * a cycle. {@code verify()} would catch the cycle, but only once somebody
	 * had written both halves; this says which direction is the wrong one.
	 */
	@Test
	void platformNeverDependsOnGhg() {
		var platform = modules.getModuleByName("platform").orElseThrow();
		assertThat(platform.getAllDependencies(modules).containsModuleNamed("ghg")).isFalse();
	}

	/**
	 * The {@code help} module measures the help and nothing else (spec 09): it
	 * takes {@code shared} for the web plumbing and no business module, so a
	 * dependency on one is a design slip rather than a need.
	 */
	@Test
	void helpDependsOnNoBusinessModule() {
		var help = modules.getModuleByName("help").orElseThrow();
		var dependencies = help.getAllDependencies(modules);
		for (var name : List.of("ghg", "user", "platform", "mail", "media")) {
			assertThat(dependencies.containsModuleNamed(name)).as("help depends on %s", name).isFalse();
		}
	}

	@Test
	void writesModuleDocumentation() {
		new Documenter(modules).writeDocumentation();
	}
}
