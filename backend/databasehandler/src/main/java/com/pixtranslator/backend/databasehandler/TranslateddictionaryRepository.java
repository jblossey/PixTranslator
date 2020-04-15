package com.pixtranslator.backend.databasehandler;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.io.Serializable;
import java.util.Collection;
import java.util.List;

@RepositoryRestResource(collectionResourceRel = "dict", path = "dict")
public interface TranslateddictionaryRepository extends CrudRepository<Translateddictionary, Serializable> {

  Translateddictionary findByGerman(@Param("german") String german);

  List<Translateddictionary> findAllByGermanInIgnoreCase(@Param("german") Collection<String> german);
}
