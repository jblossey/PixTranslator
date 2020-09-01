package com.pixtranslator.backend.databasehandler.model

import com.fasterxml.jackson.annotation.JsonManagedReference
import lombok.Getter
import lombok.Setter
import java.io.Serializable
import javax.persistence.*

@Entity
class GermanWord : Serializable {
  @Id
  @Column(unique = true)
  var word: String? = null

  @OneToMany(fetch = FetchType.LAZY, mappedBy = "germanword")
  @JsonManagedReference
  val englishWords: List<EnglishWord> = mutableListOf()
}
