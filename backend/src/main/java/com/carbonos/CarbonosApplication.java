package com.carbonos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

// async execution backs @ApplicationModuleListener (e.g. outbound mail)
@EnableAsync
@SpringBootApplication
public class CarbonosApplication {

	public static void main(String[] args) {
		SpringApplication.run(CarbonosApplication.class, args);
	}

}
