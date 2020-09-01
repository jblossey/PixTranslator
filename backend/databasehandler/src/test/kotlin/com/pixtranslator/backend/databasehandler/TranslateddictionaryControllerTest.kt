package com.pixtranslator.backend.databasehandler

import lombok.extern.slf4j.Slf4j
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.web.server.LocalServerPort
import java.nio.file.Path

@Slf4j
@SuppressWarnings("unchecked")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
internal class TranslatedictionaryControllerTest {
  @LocalServerPort
  private val port = 0

  @Autowired
  private lateinit var restTemplate: TestRestTemplate

  private val testPicPath: Path? = null

  @Test
  fun Test() {
  }
}