package com.pixtranslator.backend.databasehandler.controller

import com.pixtranslator.backend.databasehandler.model.EnglishWord
import com.pixtranslator.backend.databasehandler.model.GermanWord
import com.pixtranslator.backend.databasehandler.repository.EnglishWordRepository
import com.pixtranslator.backend.databasehandler.repository.GermanWordRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*
import java.util.function.Consumer
import javax.validation.Valid

@RestController
@RequestMapping("/germanword")
class DictionaryController (
        @Autowired
        private val germanWordRepository: GermanWordRepository,

        @Autowired
        private val englishWordRepository: EnglishWordRepository
) {


  @get:GetMapping
  val allGermanWords: Iterable<GermanWord>
    get() = germanWordRepository.findAll()

  @GetMapping("/{germanWord}")
  fun getWord(@PathVariable(name = "germanWord") germanWord: String): Optional<GermanWord> {
    return germanWordRepository.findByWordIgnoreCase(germanWord)
  }

  @PostMapping(produces = [MediaType.APPLICATION_JSON_VALUE])
  fun createWord(@RequestBody germanword: @Valid GermanWord): GermanWord {
    return germanWordRepository.save(germanword)
  }

  @PostMapping(path = ["/writemany"], produces = [MediaType.TEXT_PLAIN_VALUE])
  fun createMultipleWords(@RequestBody germans: @Valid MutableList<GermanWord>) {
    germanWordRepository.saveAll<GermanWord>(germans)
  }

  @GetMapping("/{germanWord}/englishword", "/englishword/")
  fun getEnglishTranslations(@PathVariable("germanWord") germanWord: Optional<String>,
                             @RequestBody(required = false) germanWords: List<String>?): ResponseEntity<*> {
    if (germanWord.isPresent) {
      val german = germanWordRepository.findByWordIgnoreCase(germanWord.get())
      if (german.isPresent) {
        val returnList = englishWordRepository.findAllByGermanword(german.get())
        return ResponseEntity.ok(returnList)
      }
    } else {
      if (germanWords != null && germanWords.isNotEmpty()) {
        val dictionary: MutableMap<String, List<String>> = HashMap()
        val germans = mutableListOf<GermanWord>()
        germanWords.forEach(Consumer { germans.add(germanWordRepository.findByWordIgnoreCase(it).get()) })
        for (germanword in germans) {
          dictionary[germanword.word!!] = englishWordRepository.findAllByGermanword(germanword).map { it.word!! }
        }
        return ResponseEntity.ok<Map<String, List<String>>>(dictionary)
      }
    }
    return ResponseEntity<Any?>(HttpStatus.BAD_REQUEST)
  }

  private fun getGermanFromWord(germanWord: String): GermanWord {
    val german = germanWordRepository.findByWordIgnoreCase(germanWord)
    if (!german.isPresent) {
      val newGermanWord = GermanWord()
      newGermanWord.word = germanWord
      return germanWordRepository.save(newGermanWord)
    }
    return german.get()
  }

  @PostMapping(value = ["/{germanWord}/englishword"], consumes = [MediaType.TEXT_PLAIN_VALUE])
  fun saveSingleEnglishToGerman(@PathVariable(name = "germanWord") germanWord: String,
                                @RequestBody englishWord: @Valid EnglishWord): ResponseEntity<Any> {
    if (germanWord.isNotEmpty()) {
      val germanword = getGermanFromWord(germanWord)
      englishWord.germanword = germanword
      val savedEnglishWord = englishWordRepository.save(englishWord)
      return ResponseEntity.ok(savedEnglishWord)
    }
    return ResponseEntity(HttpStatus.BAD_REQUEST)
  }

  @PostMapping(value = ["/{germanWord}/englishword/writemany"], consumes = [MediaType.APPLICATION_JSON_VALUE])
  fun saveMultipleEnglishToGerman(@PathVariable(name = "germanWord") germanWord: String,
                                  @RequestBody englishWords: @Valid MutableList<String>): ResponseEntity<*> {
    if (germanWord.isNotEmpty()) {
      val germanword = getGermanFromWord(germanWord)
      val returnList: MutableList<EnglishWord> = ArrayList()
      for (englishWord in englishWords) {
        val newEnglishWord = EnglishWord()
        newEnglishWord.word = englishWord
        newEnglishWord.germanword = germanword
        returnList.add(englishWordRepository.save(newEnglishWord))
      }
      return ResponseEntity.ok<List<EnglishWord>>(returnList)
    }
    return ResponseEntity<Any>(HttpStatus.BAD_REQUEST)
  }

  @PostMapping("/englishword/writemany")
  fun saveMultipleEnglishToMultipleGerman(@RequestBody dictionary: @Valid MutableMap<String, List<String>>): ResponseEntity<*> {
    return if (dictionary.isEmpty()) {
      ResponseEntity<Any>(HttpStatus.BAD_REQUEST)
    } else {
      val returnDictionary: MutableMap<GermanWord, List<EnglishWord>> = HashMap()
      dictionary.forEach { (germanWord: String, englishWords: List<String>) ->
        if (germanWord.isNotEmpty()) {
          val germanword = getGermanFromWord(germanWord)
          val returnList: MutableList<EnglishWord> = ArrayList()
          englishWords.forEach(Consumer { englishWord: String ->
            val newEnglishWord = EnglishWord()
            newEnglishWord.word = englishWord
            newEnglishWord.germanword = germanword
            returnList.add(englishWordRepository.save(newEnglishWord))
          })
          returnDictionary[germanword] = returnList
        }
      }
      ResponseEntity.ok().build<Any>()
    }
  }
}