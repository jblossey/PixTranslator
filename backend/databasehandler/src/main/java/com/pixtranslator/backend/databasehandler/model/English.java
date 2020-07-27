package com.pixtranslator.backend.databasehandler.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.io.Serializable;

@Entity
public class English implements Serializable {
  @Id
  @Getter
  @Setter
  @Column(unique = true)
  private String word;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "german_word")
  @JsonBackReference
  @Getter
  @Setter
  private German german;
}
