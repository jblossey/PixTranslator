package com.pixtranslator.views.dashboard;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;


/**
 * Simple DTO class for the inbox list to demonstrate complex object data
 */
@Setter
@Getter
public class HealthGridItem {

    private LocalDate itemDate;
    private String city;
    private String country;
    private String status;
    private String theme;

    public HealthGridItem() {

    }

    public HealthGridItem(LocalDate itemDate, String city, String country, String status, String theme) {
        this.itemDate = itemDate;
        this.city = city;
        this.country = country;
        this.status = status;
        this.theme = theme;
    }

}
