package com.pixtranslator.backend.databasehandler.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.io.Serializable;
import java.util.List;

@Entity
public class GermanWord implements Serializable {

  @Id
  @Getter
  @Setter
  @Column(unique = true)
  private String word;

  @OneToMany(fetch = FetchType.LAZY, mappedBy = "germanword")
  @JsonManagedReference
  @Getter
  @Setter
  private List<EnglishWord> englishWords;

}
