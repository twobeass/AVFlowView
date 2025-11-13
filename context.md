# AVFlowView Project Context (2025-11-13)

## Status: ✅ COMPLETE - Bidirectional Port Placement Implemented

JSON-gesteuerter, validierbarer A/V-Verkabelungsschema-Viewer, realisiert mit React Flow, ELK.js (layered auto-layout), Ajv (Validation), Gruppierungs-/Nesting-Logik sowie Styling/UX für professionelle node-basierte Schematic-Views.

---

## Implementierte Features

- ✅ **Visualisierung von Devices, Areas und Kabeln per JSON Data Model**
- ✅ **Automatisches Layered-Layout mit ELK.js und Hierarchien**
- ✅ **Devices/Nodes mit Ports, flexiblen Typen, Status, Kategorie**
- ✅ **Verschachtelte Areas/Räume mit Parent/Child-Verhältnissen**
- ✅ **Custom React-Node-Komponenten für Devices und Areas**
- ✅ **Bidirektionale Port-Platzierung basierend auf Edge-Richtung und Nachbar-Geometrie** (NEW)
- ✅ **AI Coding Guidance Dokumentation**

---

## Bidirectionale Ports (GELÖST)

**Problem**: Bidirektionale Ports wurden an falschen Positionen gerendert (z.B. TOP statt LEFT)

**Lösung**: 4-stufige Pipeline für automatische Port-Seitenauflösung:

1. **Berechnung** (`getPortSideDynamic`): 
   - Summe der dx/dy Distanzen zu allen verbundenen Nachbarn
   - Edge-bewusste Richtung: SOURCE ports zeigen auf TARGET, TARGET auf SOURCE
   - Layout-Richtung-Beschränkung: LR nur EAST/WEST, TB nur NORTH/SOUTH

2. **Mapping** (`buildPortSidesMap`): 
   - Saubere Karte aufbauen: `{nodeId: {portKey: side, ...}, ...}`
   - An Layout-Return als `__portSides` property anhängen

3. **Propagation** (`flattenElkGroups`): 
   - portSidesMap an React-Layer weitergeben
   - `computedSide` in Port-Objekte mergen

4. **Rendering** (`DeviceNode`): 
   - `elkSideToPosition()` mappt ELK-Seiten zu React Flow Positionen
   - Handle an berechneter Position rendern

**Test Case (panel1.net)**:
- panel1 (SOURCE) → mx1 (TARGET, links von panel1)
- dx = -53 (negativ)
- Resultat: WEST (Links) ✅

---

## API-Stil / Schema

- Siehe `src/schemas/av-wiring-graph.schema.json`
- Edges nur zwischen Device-Nodes, nicht zu Areas
- Areas portlos, dienen als Gruppencontainer
- Nodes referenzieren `areaId` für Gruppenzugehörigkeit, Areas können sich per `parentId` verschachteln
- ELK Compound-Layout wird rekursiv aufgebaut (Area-Tree, Devices als Children)

- **Labels auf Areas sichtbar und optisch korrekt (group-node label oben links, gut lesbar)**
- **Subareas (Nesting) werden korrekt gerendert und Devices sind sticky innerhalb ihrer Parent-Area (keine Herausziehbarkeit mehr)**
- **Area/Device-Overlapping ist durch ELK-Settings und Sizing deutlich reduziert**
- **Bidirectional Ports (z.B. Netzwerk, USB) werden dynamisch platziert, teils aber noch auf falscher Seite (Platzierung beruht jetzt nach Layout auf realer Geometrie, ist aber z.T. noch nicht 100% korrekt für alle Fälle)**

---

## Erreichte Verbesserungen

- Areas visualisieren Label & Padding, Devices sowohl in Areas als auch standalone
- Parent/Child-Sticky, Area-nesting, Drag-Konstraints und fitView-Anpassungen
- Textgrößen für Labels und Nodes für bessere Lesbarkeit
- Autosizing für Areas/Nesting und Devices, dynamischer spacing/padding

---

## Offene Anforderungen 

1. **Bidirectional Ports endgültig korrekt dynamisch nach Layout positionieren (alle Wiring-Cases)**
2. **UX-Feinschliff: Port-Icons/Slot-Indikatoren noch klarer, Text-Overlapping final verhindern**
3. **Oversized Areas vermeiden, Autosizing nach Content/Children, nicht fix**
4. **Alle Fehler in Demo-Graphen weiterhin prüfen (Edges etc.)**

---

## Referenz- und Kontext-Files
- [`src/components/AVWiringViewer.tsx`](https://github.com/twobeass/AVFlowView/blob/main/src/components/AVWiringViewer.tsx)
- [`src/lib/elkMapper.ts`](https://github.com/twobeass/AVFlowView/blob/main/src/lib/elkMapper.ts)
- [`src/components/nodes/DeviceNode.tsx`](https://github.com/twobeass/AVFlowView/blob/main/src/components/nodes/DeviceNode.tsx)
- [`src/data/sampleGraph.json`](https://github.com/twobeass/AVFlowView/blob/main/src/data/sampleGraph.json)

---

## Wichtige Links / Quellen
- [React Flow Parent-Child-Relation](https://reactflow.dev/examples/interaction/parent-child-relation)
- [React Flow Subflow Example](https://reactflow.dev/examples/layout/subflow)
- [ELK.js API Reference](https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html)
- [Issue: Areas/Nesting/Sticky](https://github.com/xyflow/xyflow/discussions/3355)

---

## Nächste Entwicklungsschritte

- **Bidirectional-Ports final korrekt platzieren, ggf. Postprocessing ergänzen**
- **UX/UI-Detailverbesserungen und Endkontrolle für Area/Label/Text/Handle-Kollisionen**
- **Autosizing für Areas perfektionieren (kein absolutes Sizing mehr)**
- **Demo-Daten laufend validieren/erweitern und Testszenarien anlegen**

---

_Last updated: 2025-11-13_
