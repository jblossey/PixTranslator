package com.pixtranslator.backend.databasehandler.controller;

import com.pixtranslator.backend.databasehandler.model.EnglishWord;
import com.pixtranslator.backend.databasehandler.model.GermanWord;
import com.pixtranslator.backend.databasehandler.repository.EnglishWordRepository;
import com.pixtranslator.backend.databasehandler.repository.GermanWordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/germanword")
public class DictionaryController {

  @Autowired
  private GermanWordRepository germanWordRepository;
  @Autowired
  private EnglishWordRepository englishWordRepository;

  @GetMapping
  public Iterable<GermanWord> getAllGermanWords() {
    return germanWordRepository.findAll();
  }

  @GetMapping("/{germanWord}")
  public Optional<GermanWord> getWord(@PathVariable(name = "germanWord") String germanWord) {
    return germanWordRepository.findByWordIgnoreCase(germanWord);
  }

  @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
  public GermanWord createWord(@Valid @RequestBody GermanWord germanword) {
    return germanWordRepository.save(germanword);
  }

  @PostMapping(path = "/writemany", produces = MediaType.TEXT_PLAIN_VALUE)
  public void createMultipleWords(@Valid @RequestBody List<GermanWord> germans) {
    germanWordRepository.saveAll(germans);
  }

  @GetMapping({"/{germanWord}/englishword", "/englishword/"})
  public ResponseEntity getEnglishTranslations(@PathVariable("germanWord") Optional<String> germanWord,
                                               @RequestBody(required = false) List<String> germanWords) {
    if (germanWord != null && germanWord.isPresent()) {
      Optional<GermanWord> german = germanWordRepository.findByWordIgnoreCase(germanWord.get());
      if (german.isPresent()) {
        List<EnglishWord> returnList = englishWordRepository.findAllByGermanword(german.get());
        return ResponseEntity.ok(returnList);
      }
    }
    else{
      if (germanWords != null && !germanWords.isEmpty()) {
        Map<String, List<String>> dictionary = new HashMap<>();
        List<GermanWord> germans = new ArrayList<>();
        germanWords.forEach((singleGermanWord) -> {
          germans.add(germanWordRepository.findByWordIgnoreCase(singleGermanWord).get());
        });
        for (GermanWord germanword : germans) {
          dictionary.put(
                  germanword.getWord(),
                  englishWordRepository.findAllByGermanword(germanword).stream().map(EnglishWord::getWord).collect(Collectors.toList())
          );
        }
        return ResponseEntity.ok(dictionary);
      }
    }
    return new ResponseEntity(HttpStatus.BAD_REQUEST);
  }

  public GermanWord getGermanFromWord(String germanWord) {
    Optional<GermanWord> german = germanWordRepository.findByWordIgnoreCase(germanWord);
    if (!german.isPresent()) {
      GermanWord newGermanWord = new GermanWord();
      newGermanWord.setWord(germanWord);
      return germanWordRepository.save(newGermanWord);
    }
    return german.get();
  }

  @PostMapping(value = "/{germanWord}/englishword", consumes = MediaType.TEXT_PLAIN_VALUE)
  public ResponseEntity saveSingleEnglishToGerman(@PathVariable(name = "germanWord") String germanWord,
                                                  @Valid @RequestBody EnglishWord englishWord) {
    if (germanWord != null && !germanWord.isEmpty()) {
      GermanWord germanword = getGermanFromWord(germanWord);
      englishWord.setGermanword(germanword);
      EnglishWord savedEnglishWord = englishWordRepository.save(englishWord);
      return ResponseEntity.ok(savedEnglishWord);
    }
    return new ResponseEntity(HttpStatus.BAD_REQUEST);
  }

  @PostMapping(value = "/{germanWord}/englishword/writemany", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity saveMultipleEnglishToGerman(@PathVariable(name = "germanWord") String germanWord,
                                                    @Valid @RequestBody List<String> englishWords){
    if (germanWord != null && !germanWord.isEmpty()) {
      GermanWord germanword = getGermanFromWord(germanWord);
      List<EnglishWord> returnList = new ArrayList<>();
      for (String englishWord : englishWords) {
        EnglishWord newEnglishWord = new EnglishWord();
        newEnglishWord.setWord(englishWord);
        newEnglishWord.setGermanword(germanword);
        returnList.add(englishWordRepository.save(newEnglishWord));
      }
      return ResponseEntity.ok(returnList);
    }
    return new ResponseEntity(HttpStatus.BAD_REQUEST);
  }

  @PostMapping("/englishword/writemany")
  public ResponseEntity saveMultipleEnglishToMultipleGerman(@Valid @RequestBody Map<String, List<String>> dictionary) {
    if (dictionary.isEmpty()) {
      return new ResponseEntity(HttpStatus.BAD_REQUEST);
    } else {
      Map<GermanWord, List<EnglishWord>> returnDictionary = new HashMap<>();
      dictionary.forEach((germanWord, englishWords) -> {
        if (germanWord != null && !germanWord.isEmpty()) {
          GermanWord germanword = getGermanFromWord(germanWord);
          List<EnglishWord> returnList = new ArrayList<>();
          englishWords.forEach((englishWord) -> {
            EnglishWord newEnglishWord = new EnglishWord();
            newEnglishWord.setWord(englishWord);
            newEnglishWord.setGermanword(germanword);
            returnList.add(englishWordRepository.save(newEnglishWord));
          });
          returnDictionary.put(germanword, returnList);
        }
      });
      return ResponseEntity.ok().build();
    }
  }
}
