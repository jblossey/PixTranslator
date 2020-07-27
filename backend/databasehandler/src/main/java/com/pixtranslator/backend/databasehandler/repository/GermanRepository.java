package com.pixtranslator.backend.databasehandler.repository;

import com.pixtranslator.backend.databasehandler.model.German;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GermanRepository extends CrudRepository<German, String> {
}
