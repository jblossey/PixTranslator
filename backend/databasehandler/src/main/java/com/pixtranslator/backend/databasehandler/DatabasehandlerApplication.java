package com.pixtranslator.backend.databasehandler;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.pixtranslator.backend")
public class DatabasehandlerApplication {

  public static void main(String[] args) {
    SpringApplication.run(DatabasehandlerApplication.class, args);
  }

}
