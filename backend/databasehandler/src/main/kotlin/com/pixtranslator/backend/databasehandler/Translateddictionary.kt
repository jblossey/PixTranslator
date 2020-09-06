package com.pixtranslator.backend.databasehandler

import javax.persistence.Entity
import javax.persistence.GeneratedValue
import javax.persistence.GenerationType
import javax.persistence.Id

@Entity
class Translateddictionary(
  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private val id: Long = 0,

  private val german: String? = null,

  private val english: String? = null
)