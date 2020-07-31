package com.pixtranslator.backend.databasehandler.repository;

import com.pixtranslator.backend.databasehandler.model.EnglishWord;
import com.pixtranslator.backend.databasehandler.model.GermanWord;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnglishWordRepository extends CrudRepository<EnglishWord, String> {
  List<EnglishWord> findAllByGermanword(GermanWord germanword);
}
