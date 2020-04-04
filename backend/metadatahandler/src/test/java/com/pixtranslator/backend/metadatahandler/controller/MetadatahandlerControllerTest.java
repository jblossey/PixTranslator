package com.pixtranslator.backend.metadatahandler.controller;

import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.web.server.LocalServerPort;

import java.io.IOException;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Slf4j
@SuppressWarnings("unchecked")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class MetadatahandlerControllerTest {

  @LocalServerPort
  private int port;

  @Autowired
  private TestRestTemplate restTemplate;

  private Path testPicPath;

  @AfterAll
  static void tearDownAll() throws IOException {
    Path testPicPath = Paths.get("src/test/resources/sample_copy.jpg");
    Files.deleteIfExists(testPicPath);
    log.info("Testpic deleted.");
  }

  @BeforeEach
  void init() throws URISyntaxException, IOException {
    ClassLoader classloader = Thread.currentThread().getContextClassLoader();
    URL testPicUrl = classloader.getResource("sample.jpg");
    Path originalTestPicPath = Paths.get(testPicUrl.toURI());
    Path copyTestPicPath = Paths.get("src/test/resources/sample_copy.jpg");
    Files.copy(originalTestPicPath, copyTestPicPath, StandardCopyOption.REPLACE_EXISTING);
    this.testPicPath = copyTestPicPath;
    log.info("Fresh copy of testpic put at " + this.testPicPath.toString());
  }

  @Test
  void shouldReturnKeywordsFromSampleJpg() {
    Set<String> keywords = this.restTemplate.getForObject(
            "http://localhost:" + port + "/getKeywords?path=" + testPicPath.toString(), HashSet.class);
    assertThat(keywords)
            .contains("Nordrhein-Westfalen")
            .contains("Wesel")
            .contains("birds-eyes view");
  }

  @Test
  void shouldReturnCaptionFromSampleJpg() {
    String caption = this.restTemplate.getForObject(
            "http://localhost:" + port + "/getCaption?path=" + testPicPath.toString(), String.class);
    assertThat(caption)
            .contains("Nordrhein-Westfalen")
            .contains("Wesel")
            .contains("birds-eyes view");
  }

  @Test
  void shouldReturnKeywordsAndCaptionFromSampleJpg() {
    Map<String, ArrayList> response = this.restTemplate.getForObject(
            "http://localhost:" + port + "/getKeywordsAndCaption?path=" + testPicPath.toString(), Map.class);
    assertTrue(response.containsKey("Keywords"));
    assertTrue(response.containsKey("Caption"));
    ArrayList keywordList = response.get("Keywords");
    assertTrue(keywordList.contains("Nordrhein-Westfalen"));
    assertTrue(keywordList.contains("Wesel"));
    assertTrue(keywordList.contains("birds-eyes view"));
    String caption = (String) response.get("Caption").get(0);
    assertTrue(caption.contains("Nordrhein-Westfalen"));
    assertTrue(caption.contains("Wesel"));
    assertTrue(caption.contains("birds-eyes view"));
  }

  @Test
  void shouldWriteNewKeywordsToSampleFile() {
    String[] keywords = {"Foo", "Bar", "Baz"};
    this.restTemplate.put("http://localhost:" + port + "/updateKeywords?path=" + testPicPath.toString(), keywords);
    Set<String> response = this.restTemplate.getForObject(
            "http://localhost:" + port + "/getKeywords?path=" + testPicPath.toString(), Set.class);
    assertThat(response)
            .contains("Foo")
            .contains("Bar")
            .contains("Baz");
  }

  @Test
  void shouldWriteNewCaptionToSampleFile() {
    String caption = "Foo and Bar and certainly the Baz";
    this.restTemplate.put("http://localhost:" + port + "/updateCaption?path=" + testPicPath.toString(), caption);
    String changedCaption =
            this.restTemplate.getForObject("http://localhost:" + port + "/getCaption?path=" + testPicPath.toString(),
                    String.class);
    assertThat(changedCaption).contains("Foo and Bar and certainly the Baz");
  }

  @Test
  void shouldWriteNewKeywordsAndCaptionToSampleFile() {
    String[] keywords = {"Foo", "Bar", "Baz"};
    String caption = "Foo and Bar and certainly the Baz";
    HashMap<String, String[]> request = new HashMap<>();
    request.put("Keywords", keywords);
    request.put("Caption", new String[] {caption});
    this.restTemplate.put("http://localhost:" + port + "/updateKeywordsAndCaption?path=" + testPicPath.toString()
            , request);
    Map<String, ArrayList> response = this.restTemplate.getForObject(
            "http://localhost:" + port + "/getKeywordsAndCaption?path=" + testPicPath.toString(), Map.class);
    assertTrue(response.containsKey("Keywords"));
    assertTrue(response.containsKey("Caption"));
    assertThat(response.get("Caption")).contains("Foo and Bar and certainly the Baz");
    ArrayList newKeywordList = response.get("Keywords");
    assertTrue(newKeywordList.contains("Foo"));
    assertTrue(newKeywordList.contains("Bar"));
    assertTrue(newKeywordList.contains("Baz"));

  }
}

// Picture Description is Kirche Willibrordi Dom in Wesel in NRW. Wesel, Rheinland, Hansestadt, Niederrhein,
// Nordrhein-Westfalen, Deutschland, Wesel, DEU, Europa, Luftbiiew, Luftaufnahme, Luftbildfotografie, Luftfotografie,
// overview, Uebersicht, Vog Uebersicht, Vogelperspektive
// Keywords are Kirche Willibrordi Dom in Wesel in NRW. Wesel, Rheinland, Hansestadt, Niederrhein,
// Nordrhein-Westfalen, Deutschland, Wesel, DEU, Europa, Luftbild, birds-eyes view, Luftaufnahme, Luftbildfotografie,
// Luftfotografie, overview, Uebersicht, Vogelperspektive