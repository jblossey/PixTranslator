package com.pixtranslator.backend.databasehandler

import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication

@SpringBootApplication(scanBasePackages = ["com.pixtranslator.backend"])
open class DatabasehandlerApplication {
  fun main() {
    SpringApplication.run(DatabasehandlerApplication::class.java)
  }
}