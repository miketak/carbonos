package com.carbonos;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.DynamicPropertyRegistrar;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

	@Bean
	@ServiceConnection
	PostgreSQLContainer postgresContainer() {
		return new PostgreSQLContainer(DockerImageName.parse("postgres:17-alpine"));
	}

	static final String MINIO_USER = "minioadmin";

	static final String MINIO_PASSWORD = "minioadmin";

	@Bean
	GenericContainer<?> minioContainer() {
		// MinIO withdrew its public images in September 2026: Docker Hub and then quay.io refuse the
		// pulls. Bitnami's frozen legacy repository still serves the April 2025 build, started through
		// its own entrypoint, so this is a plain container rather than Testcontainers' MinIOContainer.
		return new GenericContainer<>(DockerImageName.parse("bitnamilegacy/minio:2025.4.22-debian-12-r2"))
			.withEnv("MINIO_ROOT_USER", MINIO_USER)
			.withEnv("MINIO_ROOT_PASSWORD", MINIO_PASSWORD)
			.withExposedPorts(9000)
			.waitingFor(Wait.forHttp("/minio/health/live").forPort(9000));
	}

	@Bean
	GenericContainer<?> mailpitContainer() {
		return new GenericContainer<>(DockerImageName.parse("axllent/mailpit:v1.24")).withExposedPorts(1025, 8025);
	}

	// No @ServiceConnection support for Mailpit — map the SMTP properties by hand.
	@Bean
	DynamicPropertyRegistrar mailProperties(GenericContainer<?> mailpitContainer) {
		return registry -> {
			registry.add("spring.mail.host", mailpitContainer::getHost);
			registry.add("spring.mail.port", () -> mailpitContainer.getMappedPort(1025));
		};
	}

	// No @ServiceConnection support for MinIO — map the storage properties by hand.
	@Bean
	DynamicPropertyRegistrar storageProperties(GenericContainer<?> minioContainer) {
		return registry -> {
			registry.add("carbonos.storage.endpoint",
					() -> "http://" + minioContainer.getHost() + ":" + minioContainer.getMappedPort(9000));
			registry.add("carbonos.storage.region", () -> "us-east-1");
			registry.add("carbonos.storage.access-key", () -> MINIO_USER);
			registry.add("carbonos.storage.secret-key", () -> MINIO_PASSWORD);
			registry.add("carbonos.storage.bucket", () -> "carbonos-media-test");
			registry.add("carbonos.storage.path-style", () -> "true");
			registry.add("carbonos.storage.create-bucket", () -> "true");
		};
	}

}
