package com.pixtranslator.backend.databasehandler.controller;

import com.pixtranslator.backend.databasehandler.model.English;
import com.pixtranslator.backend.databasehandler.model.German;
import com.pixtranslator.backend.databasehandler.repository.EnglishRepository;
import com.pixtranslator.backend.databasehandler.repository.GermanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.*;
import java.util.stream.Collectors;

@RestController
public class EnglishController {

  @Autowired
  GermanRepository germanRepository;
  @Autowired
  EnglishRepository englishRepository;

  @GetMapping({"/german/{germanWord}/english", "/german/english/"})
  public ResponseEntity getEnglishTranslations(@PathVariable("germanWord") Optional<String> germanWord,
                                               @RequestBody(required = false) List<String> germanWords){
    if (germanWord.isPresent()){
      Optional<German> german = germanRepository.findById(germanWord.get());
      if (german.isPresent()){
        return ResponseEntity.ok(englishRepository.findAllByGerman(german.get()));
      }
      return new ResponseEntity(HttpStatus.BAD_REQUEST);
    }
    else{
      if (germanWords != null && !germanWords.isEmpty()) {
        Map<String, List<String>> dictionary = new HashMap<>();
        Iterable<German> germans = germanRepository.findAllById(germanWords);
        for (German german:germans) {
          dictionary.put(
                  german.getWord(),
                  englishRepository.findAllByGerman(german).stream().map(English::getWord).collect(Collectors.toList())
          );
        }
        return ResponseEntity.ok(dictionary);
      }
      return new ResponseEntity(HttpStatus.BAD_REQUEST);
    }
  }

  public German getGermanFromWord(String germanWord){
    Optional<German> german = germanRepository.findById(germanWord);
    if (!german.isPresent()) {
      German newGerman = new German();
      newGerman.setWord(germanWord);
      return germanRepository.save(newGerman);
    }
    return german.get();
  }

  @PostMapping("/german/{germanWord}/english")
  public ResponseEntity saveSingleEnglishToGerman(@PathVariable(name = "germanWord") String germanWord,
                                             @Valid @RequestBody English english) {
    if (germanWord != null && !germanWord.isEmpty()) {
      German german = getGermanFromWord(germanWord);
      english.setGerman(german);
      English savedEnglish = englishRepository.save(english);
      return ResponseEntity.ok(savedEnglish);
    }
    return new ResponseEntity(HttpStatus.BAD_REQUEST);
  }

  @PostMapping("/german/{germanWord}/english")
  public ResponseEntity saveMultipleEnglishToGerman(@PathVariable(name = "germanWord") String germanWord,
                                                    @Valid @RequestBody List<String> englishWords){
    if (germanWord != null && !germanWord.isEmpty()) {
      German german = getGermanFromWord(germanWord);
      List<English> returnList = new ArrayList<>();
      for (String englishWord:englishWords) {
        English newEnglish = new English();
        newEnglish.setWord(englishWord);
        newEnglish.setGerman(german);
        returnList.add(englishRepository.save(newEnglish));
      }
      return ResponseEntity.ok(returnList);
    }
    return new ResponseEntity(HttpStatus.BAD_REQUEST);
  }

  @PostMapping("/german/english")
  public ResponseEntity saveMultipleEnglishToMultipleGerman(@Valid @RequestBody Map<String, List<String>> dictionary){
    if (dictionary.isEmpty()) {
      return new ResponseEntity(HttpStatus.BAD_REQUEST);
    } else {
      Map<German, List<English>> returnDictionary = new HashMap<>();
      dictionary.forEach((germanWord, englishWords) -> {
        if (germanWord != null && !germanWord.isEmpty()) {
          German german = getGermanFromWord(germanWord);
          List<English> returnList = new ArrayList<>();
          englishWords.forEach((englishWord) -> {
            English newEnglish = new English();
            newEnglish.setWord(englishWord);
            newEnglish.setGerman(german);
            returnList.add(newEnglish);
          });
          returnDictionary.put(german, returnList);
        }
      });
      return ResponseEntity.ok(returnDictionary);
    }
  }
}
