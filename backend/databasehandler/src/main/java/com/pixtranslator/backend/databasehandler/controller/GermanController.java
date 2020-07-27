package com.pixtranslator.backend.databasehandler.controller;

import com.pixtranslator.backend.databasehandler.model.German;
import com.pixtranslator.backend.databasehandler.repository.GermanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Optional;

@RestController
public class GermanController {

  @Autowired
  private GermanRepository germanRepository;

  @GetMapping("/german")
  public Iterable<German> getAllGermanWords(){
    return germanRepository.findAll();
  }

  @GetMapping("/german/{germanWord}")
  public Optional<German> getWord(@PathVariable(name = "germanWord") String germanWord){
    return germanRepository.findById(germanWord);
  }

  @PostMapping("/german")
  public German createWord(@Valid @RequestBody German german){
    return germanRepository.save(german);
  }

  @PostMapping("/german")
  public void createMultipleWords(@Valid @RequestBody Iterable<German> germans){
    germanRepository.saveAll(germans);
  }
}
