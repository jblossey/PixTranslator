package com.pixtranslator.backend.databasehandler;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

@Entity
public class Translateddictionary {

  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private long id;

  @Getter
  @Setter
  private String german;

  @Getter
  @Setter
  private String english;

}
