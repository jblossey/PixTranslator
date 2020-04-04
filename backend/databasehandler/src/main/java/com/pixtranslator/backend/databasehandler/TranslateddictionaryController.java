package com.pixtranslator.backend.databasehandler;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Slf4j
@RestController
public class TranslateddictionaryController {

  @Autowired
  private TranslateddictionaryRepository repo;

  @GetMapping("/dumpDictionary")
  public List<String> dumpDictionary() {
    Path filePath = Paths.get("src/main/resources/schema.sql");
    return repo.saveDict(filePath.toString());
  }
}
