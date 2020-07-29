package com.pixtranslator.backend.databasehandler.DictionaryControllerTestPackage;

import com.pixtranslator.backend.databasehandler.controller.DictionaryController;
import com.pixtranslator.backend.databasehandler.model.English;
import com.pixtranslator.backend.databasehandler.model.German;
import com.pixtranslator.backend.databasehandler.repository.EnglishRepository;
import com.pixtranslator.backend.databasehandler.repository.GermanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mockito;
import org.mockito.junit.MockitoJUnitRunner;
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
public class getEnglishTranslationsUnitTest {


  @MockBean
  private EnglishRepository englishRepository;
  @MockBean
  private GermanRepository germanRepository;
  @InjectMocks
  private DictionaryController englishController;

  @BeforeEach
  public void setUp() {
  }

  @Test
  public void testGermanNotPresent() {
    Optional<String> germanWord = Optional.of("test");
    Mockito.when(germanRepository.findById(Mockito.any())).thenReturn(Optional.empty());
    assertEquals(englishController.getEnglishTranslations(germanWord, null), new ResponseEntity(HttpStatus.BAD_REQUEST));
    Mockito.verify(germanRepository).findById(germanWord.get());
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
    Mockito.when(germanRepository.findById(Mockito.any())).thenReturn(Optional.of(new German()));
    List<English> returnList = new ArrayList<>();
    English english = new English();
    english.setWord("test");
    english.setGerman(new German());
    returnList.add(english);
    Mockito.when(englishRepository.findAllByGerman(Mockito.any())).thenReturn(returnList);
    assertEquals(englishController.getEnglishTranslations(germanWord, null), ResponseEntity.ok(returnList));
    Mockito.verify(englishRepository).findAllByGerman(Mockito.any());
    Mockito.verify(germanRepository).findById(germanWord.get());
  }

}
