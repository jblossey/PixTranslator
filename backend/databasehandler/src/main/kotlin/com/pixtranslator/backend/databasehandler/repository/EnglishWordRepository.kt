package com.pixtranslator.backend.databasehandler.repository

import com.pixtranslator.backend.databasehandler.model.EnglishWord
import com.pixtranslator.backend.databasehandler.model.GermanWord
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface EnglishWordRepository : CrudRepository<EnglishWord, String> {
  fun findAllByGermanword(germanword: GermanWord?): List<EnglishWord>
}