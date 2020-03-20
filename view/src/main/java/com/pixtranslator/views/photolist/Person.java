package com.pixtranslator.views.photolist;

import lombok.Getter;
import lombok.Setter;

public class Person {

    @Getter @Setter
    private String image;
    @Getter @Setter
    private String name;
    @Getter @Setter
    private String date;
    @Getter @Setter
    private String post;
    @Getter @Setter
    private String likes;
    @Getter @Setter
    private String comments;
    @Getter @Setter
    private String shares;

    public Person() {
    }
}