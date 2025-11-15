# AVFlowView Neuentwicklung mit Cytoscape.js

---

## Projektbeschreibung

AVFlowView wird komplett neu entwickelt, um sehr große und komplexe Graphen performant und skalierbar zu visualisieren. Ziel ist eine Open-Source-Lösung mit präziser Knoten- und Kantenplatzierung, Port-basierten Verbindungen und nativer Edge-Bundling-Logik auf Basis des bestehenden JSON-Schemas.

---

## Projektziele

- Skalierbarkeit für Graphen mit mehreren Tausend Knoten und Kanten
- Präzise und valide Verarbeitung des bestehenden JSON-Schemas (src/schemas/av-wiring-graph.schema.json)
- Vollständige Neuentwicklung mit React und TypeScript
- Integration von Cytoscape.js als Graph-Engine mit Custom React-Wrapper
- Benutzerfreundlichkeit durch Filter, Zoom, Drag & Drop, Fokus-Modi und Kontextmenüs
- Performanceoptimierungen via Web Worker und Virtualisierung
- Automatisierte Tests und CI/CD-Unterstützung

---

## JSON-Schema Details

Das offizielle JSON-Schema befindet sich unter `src/schemas/av-wiring-graph.schema.json` und definiert folgende Hauptstrukturen:

- **Nodes:** Knoten mit eindeutiger ID, Hersteller, Modell, Kategorie, Status, Ports (Ports sind als Objekt mit Port-IDs und Attributen definiert).
- **Edges:** Kanten mit eindeutiger ID, Source- und Target-Knoten-IDs, optional Source- und Target-Port-Keys, Kategorie, Kabeltyp etc.
- **Ports:** Ausrichtung, Typ, Geschlecht, Label und optionale Metadaten.
- **Areas:** Container zur Gruppierung von Knoten (z.B. Räume, Zonen).
- **Layout:** Steuerung von Layout-Richtung, Port-Bindungsart und Bereichs-Layouts.

Das Schema garantiert die Datenintegrität und dient als Grundlage für Typescript-Typdefinitionen und Validierungen.

---

## Erweiterter Entwicklungsplan (Tasks & Subtasks)

### 1. Initialisierung
- Setup von React/TypeScript-Projektstruktur
- Git-Repo, Linter, Formatter, CI/CD Pipeline konfigurieren
- Abhängigkeiten (Cytoscape, Zustand/Redux, Material UI o.ä.) installieren

### 2. Datenmodell & Schema-Integration
- JSON-Schema (`src/schemas/av-wiring-graph.schema.json`) importieren
- Typescript-Typen generieren oder manuell definieren
- Schema-Validator (z.B. `ajv`) einbinden
- Import- und Exportfunktionen auf Schemabasis programmieren

### 3. State Management
- Globales State mit Zustand/Redux einrichten für Graphdaten/UI-Zustände
- Aktion- und Reduzierlogik implementieren

### 4. Cytoscape Integration
- React-Komponente `<CytoscapeGraph>` entwickeln mit Lifecycle-Management
- Props auf Cytoscape-Daten synchronisieren
- Eventhandling für Klick, Drag, Zoom einbauen

### 5. Ports & Kanten
- Modellierung von Ports als eigene Zwischenelemente oder Attribute
- Positionsberechnung von Ports relativ zum Knoten
- Custom Edge Renderer zum exakten Andocken an Ports

### 6. Layout & Routing
- Einbindung von Cytoscape-Layout-Algorithmen
- Edge Bundling konfigurieren
- Dynamische Neuberechnung bei Interaktionen

### 7. UI-Entwicklung
- Entwicklung von UI-Elementen (Filter, Zoom, Kontextmenüs, Fokus)
- Responsives und performantes Interaktionsdesign

### 8. Performance
- Auslagerung von Layout-Operationen in Web Worker
- Virtualisierung bei sehr großen Graphen prüfen
- Optimierungszyklen mit Profiling

### 9. Testing
- Unit Tests für State, Utils, Komponenten
- Integrationstests für React-Cytoscape Wrapper
- UI- und Performancetests

### 10. Deployment & Dokumentation
- Dokumentationspflege (Entwickler, Nutzer)
- Automatisierte Produktions-Builds und Deployment

---

## Vergleich mit aktuellem Stack
| Kriterien | Aktueller Stack | Neuer Stack mit Cytoscape |
|---|---|---|
| Rendering | SVG/WebGL | Canvas für Performance
| Edge Separation | Eingeschränkt | Native Edge Bundling
| Layout | ELK | Umfangreiche Algorithmen
| React Integration | Nativ | Wrapper erforderlich
| Skalierbarkeit | Mittelgroß | Hoch
| Anpassbarkeit | Limitiert | Sehr hoch |

---

## Empfehlung
Für die langfristige Skalierbarkeit, Performance und Flexibilität wird die Neuentwicklung mit Cytoscape.js unter Beibehaltung des bestehenden JSON-Schemas dringend empfohlen. Schrittweise Migration und paralleler Betrieb sind möglich, sollten aber sorgfältig geplant werden.

---

## Zeitplan (Wochen)
1. Projektsetup: 1
2. Schema & Datenmodell: 1
3. State Management: 2
4. Cytoscape Integration & Ports: 4
5. Layout & Routing: 3
6. UI & Interaktion: 3
7. Performanceoptimierung: 2
8. Testing & Deployment: 2

---

Dieses Dokument wurde auf Basis der aktuellen Codebasis und des offiziellen Schemas im Repo erstellt und ergänzt.

