# AVFlowView Project Context (2025-11-13)

## Ziel

JSON-gesteuerter, validierbarer MVP-Viewer für A/V-Verkabelungsschemata, realisiert mit React Flow, ELK.js (layered auto-layout), Ajv (Validation), Gruppierungs-/Nesting-Logik sowie Styling/UX-Anforderungen für professionelle node-basierte Schematic-Views.

---

## Stand der Technik

- **Visualisierung von Devices, Areas (Raum, Rack, Zone etc.) und Kabeln per JSON Data Model**
- Automatisches Layered-Layout mit ELK.js und Hierarchien (Areas als Compound-Nodes)
- Devices/Nodes mit eigenen Ports, flexiblen Typen, Status, Kategorie/Kontext
- Areas/Räume sollten verschachtelt funktionieren und Devices logisch inkl. Parent/Child-Verhältnissen gruppieren
- Custom React-Node-Komponenten für Devices und Areas (mit Label)

---

## API-Stil / Schema

- Siehe `src/schemas/av-wiring-graph.schema.json`
- Edges nur zwischen Device-Nodes, nicht zu Areas
- Areas portlos, dienen als Gruppencontainer
- Nodes referenzieren `areaId` für Gruppenzugehörigkeit, Areas können sich per `parentId` verschachteln
- ELK Compound-Layout wird rekursiv aufgebaut (Area-Tree, Devices als Children)

---

## Aktuelle Pain Points & Offene Probleme (Stand 13.11.2025):

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
