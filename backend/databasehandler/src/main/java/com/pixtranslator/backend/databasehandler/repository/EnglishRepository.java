package com.pixtranslator.backend.databasehandler.repository;

import com.pixtranslator.backend.databasehandler.model.English;
import com.pixtranslator.backend.databasehandler.model.German;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnglishRepository extends CrudRepository<English, String> {
  List<English> findAllByGerman(German german);
}
