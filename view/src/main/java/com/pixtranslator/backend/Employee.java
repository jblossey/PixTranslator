package com.pixtranslator.backend;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;

@Data
public class Employee {

    @JsonIgnore
    private Long id;

    private String idString;
    private String firstname;
    private String lastname;
    private String title;
    private String email;
    private String notes = "";

    public Employee(Long id, String firstname, String lastname, String email, String title) {
        super();
        this.id = id;
        this.firstname = firstname;
        this.lastname = lastname;
        this.email = email;
        this.title = title;
    }

    public Employee() {

    }

}
