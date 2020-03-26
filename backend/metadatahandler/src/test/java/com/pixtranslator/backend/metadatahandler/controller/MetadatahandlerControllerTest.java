package com.pixtranslator.backend.metadatahandler.controller;

import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.web.server.LocalServerPort;

import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class MetadatahandlerControllerTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private ClassLoader classloader = Thread.currentThread().getContextClassLoader();
    private URL testPicUrl = classloader.getResource("sample.jpg");
    private Path testPicPath;
    {
        try {
            testPicPath = Paths.get(testPicUrl.toURI());
            log.info("Pic Url is: "+testPicUrl.toString()+"\nPic Path is: "+testPicPath.toString());
        } catch (URISyntaxException e) {
            e.printStackTrace();
        }
    }

    @Test
    void shouldReturnKeywordsFromSampleJpg() {
        assertThat(this.restTemplate.getForObject(
                "http://localhost:"+port+"/getKeywords?path="+testPicPath.toString(), String.class))
                .contains("Willibrordi")
                .contains("Wesel")
                .contains("birds-eyes view");
    }

    @Test
    void shouldReturnCaptionFromSampleJpg() {
        assertThat(this.restTemplate.getForObject(
                "http://localhost:"+port+"/getCaption?path="+testPicPath.toString(), String.class))
                .contains("Willibrordi")
                .contains("Wesel")
                .contains("birds-eyes view");
    }

    @Test
    void shouldReturnKeywordsAndCaptionFromSampleJpg() {
        assertThat(this.restTemplate.getForObject(
                "http://localhost:"+port+"/getKeywordsAndCaption?path="+testPicPath.toString(), String.class))
                .contains("Willibrordi")
                .contains("Wesel")
                .contains("birds-eyes view")
                .contains("Keywords")
                .contains("Caption");
    }
}

// Picture Description is Kirche Willibrordi Dom in Wesel in NRW. Wesel, Rheinland, Hansestadt, Niederrhein, Nordrhein-Westfalen, Deutschland, Wesel, DEU, Europa, Luftbiiew, Luftaufnahme, Luftbildfotografie, Luftfotografie, overview, Uebersicht, Vog Uebersicht, Vogelperspektive
// Keywords are Kirche Willibrordi Dom in Wesel in NRW. Wesel, Rheinland, Hansestadt, Niederrhein, Nordrhein-Westfalen, Deutschland, Wesel, DEU, Europa, Luftbild, birds-eyes view, Luftaufnahme, Luftbildfotografie, Luftfotografie, overview, Uebersicht, Vogelperspektive