package com.pixtranslator.backend.databasehandler.DictionaryControllerTestPackage;

import com.pixtranslator.backend.databasehandler.controller.DictionaryController;
import com.pixtranslator.backend.databasehandler.model.EnglishWord;
import com.pixtranslator.backend.databasehandler.model.GermanWord;
import com.pixtranslator.backend.databasehandler.repository.EnglishWordRepository;
import com.pixtranslator.backend.databasehandler.repository.GermanWordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith({SpringExtension.class, MockitoExtension.class})
public class getEnglishWordTranslationsUnitTest {


  @MockBean
  private EnglishWordRepository englishWordRepository;
  @MockBean
  private GermanWordRepository germanWordRepository;
  @InjectMocks
  private DictionaryController englishController;

  @BeforeEach
  public void setUp() {
  }

  @Test
  public void testGermanNotPresent() {
    Optional<String> germanWord = Optional.of("test");
    Mockito.when(germanWordRepository.findById(Mockito.any())).thenReturn(Optional.empty());
    assertEquals(englishController.getEnglishTranslations(germanWord, null),
            new ResponseEntity(HttpStatus.BAD_REQUEST));
    Mockito.verify(germanWordRepository).findById(germanWord.get());
  }

  @Test
  public void testGermanWordIsNull() {
    assertEquals(this.englishController.getEnglishTranslations(null, null), new ResponseEntity(HttpStatus.BAD_REQUEST));
  }

  @Test
  public void testGermanWordIsEmpty() {
    assertEquals(this.englishController.getEnglishTranslations(Optional.empty(), null), new ResponseEntity(HttpStatus.BAD_REQUEST));
  }

  @Test
  public void testNormalGermanWordOk() {
    Optional<String> germanWord = Optional.of("test");
    Mockito.when(germanWordRepository.findById(Mockito.any())).thenReturn(Optional.of(new GermanWord()));
    List<EnglishWord> returnList = new ArrayList<>();
    EnglishWord englishWord = new EnglishWord();
    englishWord.setWord("test");
    englishWord.setGermanword(new GermanWord());
    returnList.add(englishWord);
    Mockito.when(englishWordRepository.findAllByGermanword(Mockito.any())).thenReturn(returnList);
    assertEquals(englishController.getEnglishTranslations(germanWord, null), ResponseEntity.ok(returnList));
    Mockito.verify(englishWordRepository).findAllByGermanword(Mockito.any());
    Mockito.verify(germanWordRepository).findById(germanWord.get());
  }

}
