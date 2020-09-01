package com.pixtranslator.backend.databasehandler.model

import com.fasterxml.jackson.annotation.JsonBackReference
import java.io.Serializable
import javax.persistence.*

@Entity
class EnglishWord : Serializable {
  @Id
  @Column(unique = true)
  var word: String? = null

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "germanword_englishword")
  @JsonBackReference
  var germanword: GermanWord? = null
}
