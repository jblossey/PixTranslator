package com.pixtranslator.backend.metadatahandler;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.pixtranslator.backend")
public class MetadatahandlerApplication {

	public static void main(String[] args) {
		SpringApplication.run(MetadatahandlerApplication.class, args);
	}

}
