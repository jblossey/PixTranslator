package com.pixtranslator.backend.databasehandler.DictionaryControllerTestPackage

import com.pixtranslator.backend.databasehandler.controller.DictionaryController
import com.pixtranslator.backend.databasehandler.model.EnglishWord
import com.pixtranslator.backend.databasehandler.model.GermanWord
import com.pixtranslator.backend.databasehandler.repository.EnglishWordRepository
import com.pixtranslator.backend.databasehandler.repository.GermanWordRepository
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.Mockito
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.test.context.junit.jupiter.SpringExtension
import java.util.*

@ExtendWith(SpringExtension::class, MockitoExtension::class)
class GetEnglishWordTranslationsUnitTest {
  @Mock
  private lateinit var englishWordRepository: EnglishWordRepository

  @Mock
  private lateinit var germanWordRepository: GermanWordRepository

  private lateinit var englishController: DictionaryController

  @BeforeEach
  fun setUp() {
    englishController = DictionaryController(germanWordRepository, englishWordRepository)
  }

  @Test
  fun testGermanNotPresent() {
    val germanWord = Optional.of("test")
    Mockito.`when`(germanWordRepository.findByWordIgnoreCase(Mockito.any())).thenReturn(Optional.empty())
    Assertions.assertEquals(englishController.getEnglishTranslations(germanWord, emptyList()),
            ResponseEntity<Any?>(HttpStatus.BAD_REQUEST))
    Mockito.verify(germanWordRepository)!!.findByWordIgnoreCase(germanWord.get())
  }

  @Test
  fun testGermanWordIsEmpty() {
    Assertions.assertEquals(englishController.getEnglishTranslations(Optional.empty(), null), ResponseEntity<Any?>(HttpStatus.BAD_REQUEST))
  }

  @Test
  fun testNormalGermanWordOk() {
    val germanWord = Optional.of("test")
    Mockito.`when`(germanWordRepository.findByWordIgnoreCase(Mockito.any())).thenReturn(Optional.of(GermanWord()))
    val returnList: MutableList<EnglishWord> = ArrayList()
    val englishWord = EnglishWord()
    englishWord.word = "test"
    englishWord.germanword = GermanWord()
    returnList.add(englishWord)
    Mockito.`when`(englishWordRepository.findAllByGermanword(Mockito.any())).thenReturn(returnList)
    Assertions.assertEquals(englishController.getEnglishTranslations(germanWord, null), ResponseEntity.ok<List<EnglishWord>>(returnList))
    Mockito.verify(englishWordRepository).findAllByGermanword(Mockito.any())
    Mockito.verify(germanWordRepository).findByWordIgnoreCase(germanWord.get())
  }
}