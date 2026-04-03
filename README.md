# CarCostCompare

> **Vergleiche die langfristigen Gesamtkosten verschiedener Fahrzeuge in Deutschland.**

Eine schlanke, serverlose Webanwendung (reines HTML / CSS / JavaScript), die dir hilft, den echten Preis eines Kfz-Wechsels zu ermitteln – inklusive Wertverlust, Kraftstoff, Kfz-Steuer, Versicherung, Wartung und Finanzierung.

## Features

| Feature | Details |
|---|---|
| Mehrere Fahrzeuge | Beliebig viele Fahrzeuge vergleichen |
| Fahrzeug-Presets | Vorgefüllte Audi-Diesel- und aktuelle Elektroauto-Beispiele laden |
| Aktuelles Fahrzeug markieren | Kennzeichne dein Bestandsfahrzeug als Referenz |
| Alle Kostenarten | Wertverlust, Kraftstoff/Strom, Wartung, Versicherung, Kfz-Steuer, Finanzierung |
| THG-Quote für BEV | Jährliche THG-Prämie für reine Elektroautos als Gutschrift im Kostenvergleich |
| Alle Antriebsarten | Benzin, Diesel, Elektro (BEV), Plug-in Hybrid (PHEV), LPG/Autogas |
| Kfz-Steuer (DE) | Vereinfachtes Modell nach deutschem Recht 2024 (Hubraum + CO₂-Komponente) |
| Finanzierungsrechner | Annuitätendarlehen mit Zinsberechnung |
| Visualisierung | Gesamtkosten-Balkendiagramm + gestapeltes Kostenaufteilungsdiagramm |
| Ergebnistabelle | Detaillierter Vergleich aller Kostenblöcke + Ersparnis vs. Aktuell |
| Betrachtungszeitraum | 1–20 Jahre frei wählbar |

## Schnellstart

Die App benötigt keinen Build-Schritt.  
Öffne einfach `index.html` in einem Browser **oder** nutze einen lokalen HTTP-Server:

```bash
# Mit Python 3 (kein npm nötig)
python3 -m http.server 8080
# → http://localhost:8080

# Oder mit Node.js / npx
npx serve .
```

## Tests

Abhängigkeiten installieren und Tests ausführen:

```bash
npm install
npm test
```

Tests befinden sich in `tests/calc.test.js` und `tests/app.test.js`. Sie decken die Berechnungslogik sowie wichtige UI-Eingabeflüsse ab.

## Für Agenten & Mitwirkende

Die schnellste Iteration auf diesem Repo:

1. `README.md` lesen (Produktkontext + Nutzer-Workflow)
2. `CONTRIBUTING.md` lesen (Setup, Validierung, Bearbeitungsregeln)
3. Relevante Datei direkt bearbeiten:
   - `calc.js` → Berechnungslogik
   - `app.js` → DOM/UI-Verhalten
   - `index.html` → Markup
   - `styles.css` → Styling
   - `tests/*.test.js` → Regressionstests

Wichtige Rahmenbedingungen:

- Kein Build-Schritt: Änderungen lassen sich direkt per Browser oder lokalem HTTP-Server prüfen.
- Bestehende Validierung: `npm test`
- Kleine, gezielte Änderungen bevorzugen und Dokumentation aktualisieren, wenn sich Workflow oder Struktur ändern.

## Projektstruktur

```
├── index.html          # Haupt-HTML-Seite
├── styles.css          # CSS-Styles
├── calc.js             # Berechnungslogik (Kfz-Steuer, TCO, Finanzierung)
├── app.js              # UI-Logik & DOM-Manipulation
├── tests/
│   ├── calc.test.js    # Jest-Unit-Tests für die Berechnungslogik
│   └── app.test.js     # Jest-Tests für DOM/UI-Verhalten
├── CONTRIBUTING.md     # Setup- und Iterationshinweise für Mitwirkende/Agenten
└── package.json        # npm-Konfiguration (Jest)
```

## Kostenmodell (Überblick)

```
Gesamtkosten = Wertverlust
             + Kraftstoffkosten (km/Jahr ÷ 100 × Verbrauch × Preis × Jahre)
             + Wartungskosten (jährlich × Jahre)
             + Versicherung (jährlich × Jahre)
             + Kfz-Steuer (jährlich × Jahre)
             − THG-Quote (nur BEV, jährlich × Jahre)
             + Finanzierungskosten (Gesamtrückzahlung − Darlehensbetrag)
```

## THG-Quote in Deutschland (BEV)

Die App berücksichtigt nun die **THG-Quote** für reine Batterie-Elektrofahrzeuge als jährliche Gutschrift:

- **Anspruch in der Regel nur für reine Elektroautos (BEV)**, nicht für Plug-in-Hybride.
- Die Auszahlung wird **jährlich** beantragt und kann je nach Anbieter und Marktpreis schwanken.
- Deshalb ist der THG-Wert in der App **editierbar**. Für BEV ist standardmäßig ein konservativer Richtwert von **300 EUR/Jahr** hinterlegt.

Quellen zur Einordnung:

- ADAC: https://www.adac.de/rund-ums-fahrzeug/elektromobilitaet/elektroauto/thg-quote/
- Verbraucherzentrale: https://www.verbraucherzentrale.de/wissen/energie/emobilitaet/thgquote-so-koennen-sie-mit-einem-reinen-eauto-geld-verdienen-68695
- HUK-COBURG: https://www.huk.de/fahrzeuge/ratgeber/elektroautos/co2-zertifikat-verkaufen.html

## Lizenz

[MIT](LICENSE)
