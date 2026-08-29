package com.carbonos;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.DynamicPropertyRegistrar;
import org.testcontainers.containers.MinIOContainer;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

	@Bean
	@ServiceConnection
	PostgreSQLContainer postgresContainer() {
		return new PostgreSQLContainer(DockerImageName.parse("postgres:17-alpine"));
	}

	@Bean
	MinIOContainer minioContainer() {
		return new MinIOContainer(DockerImageName.parse("minio/minio:RELEASE.2025-04-22T22-12-26Z"));
	}

	// No @ServiceConnection support for MinIO — map the storage properties by hand.
	@Bean
	DynamicPropertyRegistrar storageProperties(MinIOContainer minio) {
		return registry -> {
			registry.add("carbonos.storage.endpoint", minio::getS3URL);
			registry.add("carbonos.storage.region", () -> "us-east-1");
			registry.add("carbonos.storage.access-key", minio::getUserName);
			registry.add("carbonos.storage.secret-key", minio::getPassword);
			registry.add("carbonos.storage.bucket", () -> "carbonos-media-test");
			registry.add("carbonos.storage.path-style", () -> "true");
			registry.add("carbonos.storage.create-bucket", () -> "true");
		};
	}

}
