package com.pixtranslator.backend.metadatahandler.controller;

import com.adobe.internal.xmp.XMPException;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.imaging.ImageReadException;
import org.apache.commons.imaging.ImageWriteException;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static com.pixtranslator.backend.metadatahandler.model.Metadatareader.*;
import static com.pixtranslator.backend.metadatahandler.model.Metadatawriter.*;

@RestController
@Slf4j
public class MetadatahandlerController {

    @GetMapping("/getKeywords")
    public Set<String> extractKeywords(@RequestParam(name = "path") File picture)
            throws IOException, ImageReadException, XMPException {
        log.info("Executing getKeywords on " + picture.toString());
        return getKeywords(picture);
    }

    @GetMapping("/getCaption")
    public String extractCaption(@RequestParam(name = "path") File picture)
            throws XMPException, ImageReadException, IOException {
        log.info("Executing getCaption on " + picture.toString());
        return getCaption(picture);
    }

    @GetMapping("/getKeywordsAndCaption")
    public Map<String, String[]> extractKeywordsAndCaption(@RequestParam(name = "path") File picture)
            throws IOException, ImageReadException, XMPException {
        log.info("Executing getKeywordsAndCaption on " + picture.toString());
        return getKeywordsAndCaption(picture);
    }

    @PutMapping("/updateKeywords")
    public void updateKeywords(@RequestParam(name = "path") File picture, @RequestBody String[] keywords)
            throws ImageWriteException, ImageReadException, XMPException, IOException {
        log.info("Rewriting Keywords on " + picture.toString());
        rewriteKeywords(picture, keywords);
    }

    @PutMapping("/updateCaption")
    public void updateCaption(@RequestParam(name = "path") File picture, @RequestBody String caption)
            throws ImageWriteException, ImageReadException, XMPException, IOException {
        log.info("Rewriting Caption on " + picture.toString());
        rewriteCaption(picture, caption);
    }

    @PutMapping("/updateKeywordsAndCaption")
    public void updateKeywordsAndCaption(@RequestParam(name = "path") File picture, @RequestBody HashMap<String, String[]> keysAndCap)
            throws ImageWriteException, IOException, XMPException, ImageReadException {
        log.info("Rewriting Keywords and Caption on " + picture.toString());
        String [] keywords = keysAndCap.get("Keywords");
        String caption = keysAndCap.get("Caption")[0];
        rewriteKeywordsAndCaption(picture, keywords, caption);
    }
}
