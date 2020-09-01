package com.pixtranslator.backend.databasehandler

import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.data.rest.core.annotation.RepositoryRestResource
import java.util.Collection
import java.util.List

@RepositoryRestResource(collectionResourceRel = "dict", path = "dict")
interface TranslateddictionaryRepository : CrudRepository<Translateddictionary, Long> {
  fun findByGerman(@Param("german") german: String): Translateddictionary?
  fun findAllByGermanInIgnoreCase(@Param("german") german: Collection<String>): List<Translateddictionary>
}