package com.pixtranslator.backend.metadatahandler.controller;

import com.adobe.internal.xmp.XMPException;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.imaging.ImageReadException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.io.IOException;
import java.util.Map;
import java.util.Set;

import static com.pixtranslator.backend.metadatahandler.model.Metadatareader.*;

@RestController
@Slf4j
public class MetadatahandlerController {

    @GetMapping("/getKeywords")
    public Set<String> extractKeywords(@RequestParam(name = "path") File picture) throws IOException, ImageReadException {
        return getKeywords(picture);
    }

    @GetMapping("/getCaption")
    public String extractCaption(@RequestParam(name = "path") File picture) throws XMPException, ImageReadException, IOException {
        log.info("Executing getCaption on " + picture.toString());
        return getCaption(picture);
    }

    @GetMapping("/getKeywordsAndCaption")
    public Map<String, Object[]> extractKeywordsAndCaptions(@RequestParam(name = "path") File picture) throws IOException, ImageReadException, XMPException {
        return getKeywordsAndCaptions(picture);
    }
}
