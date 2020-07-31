package com.pixtranslator.backend.databasehandler.repository;

import com.pixtranslator.backend.databasehandler.model.GermanWord;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GermanWordRepository extends CrudRepository<GermanWord, String> {
  Optional<GermanWord> findByWordIgnoreCase(String word);
}
