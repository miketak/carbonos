package com.carbonos;

import org.junit.jupiter.api.Test;
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

	@Test
	void writesModuleDocumentation() {
		new Documenter(modules).writeDocumentation();
	}
}
