package com.pixtranslator.backend.databasehandler.repository

import com.pixtranslator.backend.databasehandler.model.GermanWord
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface GermanWordRepository : CrudRepository<GermanWord, String> {
  fun findByWordIgnoreCase(word: String?): Optional<GermanWord>
}