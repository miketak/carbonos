package com.carbonos;

import org.springframework.boot.SpringApplication;

public class TestCarbonosApplication {

	public static void main(String[] args) {
		SpringApplication.from(CarbonosApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
