# CarCostCompare

> **Vergleiche die langfristigen Gesamtkosten verschiedener Fahrzeuge in Deutschland.**

Eine schlanke, serverlose Webanwendung (reines HTML / CSS / JavaScript), die dir hilft, den echten Preis eines Kfz-Wechsels zu ermitteln – inklusive Wertverlust, Kraftstoff, Kfz-Steuer, Versicherung, Wartung und Finanzierung.

## Features

| Feature | Details |
|---|---|
| Mehrere Fahrzeuge | Beliebig viele Fahrzeuge vergleichen |
| Aktuelles Fahrzeug markieren | Kennzeichne dein Bestandsfahrzeug als Referenz |
| Alle Kostenarten | Wertverlust, Kraftstoff/Strom, Wartung, Versicherung, Kfz-Steuer, Finanzierung |
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

Tests befinden sich in `tests/calc.test.js` und prüfen die gesamte Berechnungslogik (Kfz-Steuer, Finanzierung, TCO-Gesamtkostenrechnung).

## Projektstruktur

```
├── index.html          # Haupt-HTML-Seite
├── styles.css          # CSS-Styles
├── calc.js             # Berechnungslogik (Kfz-Steuer, TCO, Finanzierung)
├── app.js              # UI-Logik & DOM-Manipulation
├── tests/
│   └── calc.test.js    # Jest-Unit-Tests für die Berechnungslogik
└── package.json        # npm-Konfiguration (Jest)
```

## Kostenmodell (Überblick)

```
Gesamtkosten = Wertverlust
             + Kraftstoffkosten (km/Jahr ÷ 100 × Verbrauch × Preis × Jahre)
             + Wartungskosten (jährlich × Jahre)
             + Versicherung (jährlich × Jahre)
             + Kfz-Steuer (jährlich × Jahre)
             + Finanzierungskosten (Gesamtrückzahlung − Darlehensbetrag)
```

## Lizenz

[MIT](LICENSE)
