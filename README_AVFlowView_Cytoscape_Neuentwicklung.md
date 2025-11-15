# AVFlowView Neuentwicklung mit Cytoscape.js

---

## Projektbeschreibung

AVFlowView wird komplett neu entwickelt, um den Umgang mit großen und komplexen Graphen zu verbessern. Ziel ist es, eine skalierbare, performante und hochgradig interaktive Graphvisualisierung auf Open-Source-Basis zu schaffen. Der Fokus liegt auf:

- Nativer Edge-Bundling-Logik für gute Edge-Separation
- Präziser Port-basierter Verbindungslogik
- Unterstützen sehr großer Graphen (Skalierbarkeit)
- Optimiertem Node- und Edge-Placement
- Vollständiger React-Integration
- Kompatibilität zum bestehenden JSON-Schema


---

## Projektziele

- Höchste Performance und Skalierbarkeit für Graphen mit Tausenden Knoten und Kanten
- Klare und wartbare Codebasis in React mit TypeScript
- Erweiterbarkeit und Modularität durch sauberes State-Management und Wrapper-Komponenten
- Benutzerfreundliche UI mit Fokusmodi, Filterung, Zoom, Pan und Kontextmenüs
- Automatisierte Tests zur Sicherung von Funktionalität und Performance

---

## JSON-Schema Übersicht

**Beispielhafte Struktur für Knoten, Kanten und Ports:**

```json
{
  "nodes": [
    {
      "id": "node1",
      "label": "Node 1",
      "position": {"x": 100, "y": 200},
      "ports": [
        { "id": "port1", "offset": {"x": 10, "y": 20} },
        { "id": "port2", "offset": {"x": -10, "y": 20} }
      ]
    }
  ],
  "edges": [
    {
      "id": "edge1",
      "source": "node1",
      "sourcePort": "port1",
      "target": "node2",
      "targetPort": "port3",
      "label": "Edge from Node1 to Node2"
    }
  ]
}
```

**Erklärung:**
- `nodes` enthält eine Liste von Knoten mit `id`, `label`, Position und Ports.
- Jeder `port` hat eine eigene `id` und eine Positions-Offset relativ zum Knoten.
- `edges` definieren Verbindungen zwischen Knoten über Ports unter Angabe von Quell- und Zielport.

---

## Detaillierter Entwicklungsplan (Tasks & Subtasks)

### 1. Projektinitialisierung

- Projektstruktur aufsetzen (React + TypeScript)
- Git-Repository anlegen und CI/CD einrichten
- Abhängigkeiten installieren (Cytoscape, Zustand/Redux, UI-Bibliothek)

### 2. Datenmodell & State Management

- JSON-Schema analysieren und Typen in TypeScript definieren
- JSON-Schema-Validator (z.B. `ajv`) implementieren
- Globalen Zustand mit Zustand/Redux anlegen
- State-Schnittstellen für Graphdaten und UI-Zustände implementieren

### 3. Cytoscape Integration

- React Wrapper Komponente `<CytoscapeGraph>` entwickeln
- Lifecycle und Synchronisation von Props mit Cytoscape-Instanz
- Event-Handling (Klick, Drag, Zoom) integrieren

### 4. Ports und Verbindungslogik

- Ports als eigene Kinder-Knoten oder Knoten-Attribute implementieren
- Positionsberechnung (Node Position + Port Offset)
- Kanten exakt an Ports andocken mit Custom Edge Rendering

### 5. Layout & Routing

- Cytoscape Layouts (Force-directed, hierarchisch) implementieren
- Edge-Bundling Plugin integrieren und konfigurieren
- Dynamisches Neulayout bei Interaktion unterstützen

### 6. UI & Interaktion

- UI-Bibliothek einbinden (Material UI o.ä.)
- Zoom, Pan, Focus Mode, Filter, Kontextmenüs, Tooltipps implementieren

### 7. Performanceoptimierung

- Layout und Routing in Web Worker auslagern
- Virtualisierung / Lazy Loading prüfen
- Profiling und Optimierungen durchführen

### 8. Testing

- Unit Tests für Komponenten und State
- Integrationstests für Cytoscape Wrapper und Events
- UI/Performance Tests

### 9. Dokumentation & Deployment

- Entwickler- und Nutzerdokumentation erstellen
- Produktions-Build und Deployment automatisieren

### 10. Migration & Parallelbetrieb (optional)

- Adapter/Wrapper für bestehende JSON-Daten
- Parallelbetrieb alter und neuer Komponenten ermöglichen

---

## Technische Umsetzung Port-Logik

- Ports als separate Port-Knoten erstellen oder als Node-Attribute speichern
- Port-Position relativ zum Node-Mittelpunkt als Offset definieren
- Absolute Port-Position berechnen für präzise Kantenverbindung
- Kantenquellen und -ziele auf entsprechende Ports mappen
- Custom Edge Renderer zur exakten Verbindung auf Port-Positionen einsetzen

---

## Vergleich mit aktuellem Stack

| Merkmal                 | Aktueller Stack (React Flow + ELK)       | Neuer Stack (React + Cytoscape.js)         |
|-------------------------|------------------------------------------|--------------------------------------------|
| Rendering               | SVG / WebGL                              | Canvas (leistungsfähig bei großen Graphen) |
| Edge-Separation         | Eingeschränkt                           | Native Edge Bundling und Routing           |
| Layout-Algorithmen      | ELK (hierarchisch, orthogonal)           | Umfangreiche integrierte Algorithmen        |
| React-Integration       | Native Komponenten, gute React-Unterstützung | Wrapper notwendig, React-Kompatibilität       |
| Skalierbarkeit          | Mittelgut bis mittelgroß                  | Sehr gut für sehr große Graphen             |
| Anpassbarkeit           | Eingeschränkt                            | Sehr flexibel mit hohen Entwicklungsaufwand |


---

## Empfehlung & Fazit

- Für nachhaltige Skalierbarkeit und bessere Edge-Separation ist eine Neuentwicklung mit Cytoscape.js empfohlen.
- Paralleler Betrieb in Übergangsphase ist möglich, erhöht aber Code-Komplexität.
- Schrittweise Migration ist sinnvoll, beginnend mit Grundfunktionen und Port-Logik.

---

## Zeitplan (Schätzung in Wochen)

1. Projektsetup & Grundstruktur: 1
2. Datenmodell & State Management: 1
3. Cytoscape Integration & React Wrapper: 2
4. Ports & Kantenverbindung: 2
5. Layout & Routing: 2
6. UI & Interaktion: 2
7. Performanceoptimierung: 1
8. Testing & Qualitätssicherung: 1
9. Dokumentation & Deployment: fortlaufend
