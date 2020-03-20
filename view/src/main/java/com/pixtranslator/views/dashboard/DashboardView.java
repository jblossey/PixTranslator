package com.pixtranslator.views.dashboard;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.vaadin.flow.component.Component;
import com.vaadin.flow.component.board.Board;
import com.vaadin.flow.component.charts.Chart;
import com.vaadin.flow.component.charts.model.ChartType;
import com.vaadin.flow.component.charts.model.Configuration;
import com.vaadin.flow.component.charts.model.Crosshair;
import com.vaadin.flow.component.charts.model.ListSeries;
import com.vaadin.flow.component.charts.model.XAxis;
import com.vaadin.flow.component.charts.model.YAxis;
import com.vaadin.flow.component.dependency.CssImport;
import com.vaadin.flow.component.dependency.JsModule;
import com.vaadin.flow.component.grid.Grid;
import com.vaadin.flow.component.grid.GridVariant;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.H2;
import com.vaadin.flow.component.html.H3;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.textfield.PasswordField;
import com.vaadin.flow.data.renderer.ComponentRenderer;
import com.vaadin.flow.router.AfterNavigationEvent;
import com.vaadin.flow.router.AfterNavigationObserver;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.router.RouteAlias;
import com.pixtranslator.views.root.RootView;
import org.jetbrains.annotations.Contract;
import org.jetbrains.annotations.NotNull;

@Route(value = "dashboard", layout = RootView.class)
@RouteAlias(value = "", layout = RootView.class)
@PageTitle("Dashboard")
@CssImport(value = "styles/views/dashboard/dashboard-view.css", include = "lumo-badge")
@JsModule("@vaadin/vaadin-lumo-styles/badge.js")
public class DashboardView extends Div implements AfterNavigationObserver {


    private final H2 totalH2 = new H2();
    private final H2 usedH2 = new H2();
    private final H2 remainingH2 = new H2();
    private final PasswordField passwordField = new PasswordField();
    private final H2 languagesH2 = new H2();

    public DashboardView() {
        setId("dashboard-view");
        Board board = new Board();
        board.addRow(
                createBadge("Total", totalH2, "primary-text", "Total amount of characters included in current subscription model", "badge"),
                createBadge("Used", usedH2, "error-text", "Amount of used characters in the current payment period", "badge"),
                createBadge("Remaining", remainingH2, "success-text","Characters remaining.\n\rAccount for approx. YYY pictures left to translate (@ XY characters per pic", "badge")
        );
        board.addRow(
                passwordWrapperCard(passwordField),
                emptyWrapperCard(languagesH2)
        );
        add(board);
    }

    private WrapperCard createBadge(String title, H2 h2, String h2ClassName,
                                    String description, String badgeTheme) {
        Span titleSpan = new Span(title);
        titleSpan.getElement().setAttribute("theme", badgeTheme);

        h2.addClassName(h2ClassName);

        Span descriptionSpan = new Span(description);
        descriptionSpan.addClassName("secondary-text");

        return new WrapperCard("wrapper",
                new Component[] { titleSpan, h2, descriptionSpan }, "card",
                "space-m");
    }

    private WrapperCard passwordWrapperCard(PasswordField pass) {
        return new WrapperCard( "wrapper", new Component[]{pass}, "card", "space-m");
    }

    private WrapperCard emptyWrapperCard(H2 h2) {
        h2.addClassName("primary-text");
        return new WrapperCard("wrapper", new Component[]{h2}, "card", "space-m");
    }

    @Override
    public void afterNavigation(AfterNavigationEvent event) {

        // Set some data when this view is displayed.

        // Top row widgets
        totalH2.setText("6,666,666");
        usedH2.setText("Over 9k");
        remainingH2.setText("Quick maffs");
        languagesH2.setText("German \u2192 English");

        passwordField.setLabel("Deepl-Key");
        passwordField.setPlaceholder("Enter Deepl-Key");
    }
}
