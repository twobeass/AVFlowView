# AVFlowView Project Context (2025-11-13)

## Ziel

JSON-gesteuerter, validierbarer MVP-Viewer für A/V-Verkabelungsschemata, realisiert mit React Flow, ELK.js (layered auto-layout), Ajv (Validation), Gruppierungs-/Nesting-Logik sowie Styling/UX-Anforderungen für professionelle node-basierte Schematic-Views.

---

## Stand der Technik

- **Visualisierung von Devices, Areas (Raum, Rack, Zone etc.) und Kabeln per JSON Data Model**
- Automatisches Layered-Layout mit ELK.js und Hierarchien (Areas als Compound-Nodes)
- Devices/Nodes mit eigenen Ports, flexiblen Typen, Status, Kategorie/Kontext
- Areas/Räume sollten verschachtelt funktionieren und Devices logisch inkl. Parent/Child-Verhältnissen gruppieren
- Custom React-Node-Komponenten für Devices

---

## API-Stil / Schema

- see `src/schemas/av-wiring-graph.schema.json`
- Edges dürfen nur zwischen Device-Nodes, nicht zu Areas führen
- Areas portlos, dienen nur als Gruppencontainer
- Nodes referenzieren `areaId` für Gruppenzugehörigkeit, Areas können sich per `parentId` verschachteln
- ELK Compound-Layout wird rekursiv aufgebaut (Area-Tree, Devices als Children)

---

## Pain Points & Offene Probleme (Stand 13.11.2025):

- **Areas zeigen keine eigenen Labels im Viewer (Label wird nicht zentral auf Area-Box gerendert)**
- **Geräte/Nodes lassen sich aus ihrer Area herausziehen (React Flow Parent/Child "Sticky"-Verhalten nicht erreichbar)**
- **Areas werden (visuell) nicht autoskaliert, sondern behalten Defaultmaß; wachsen nicht mit ihren Children, auch keine visuelle Verschachtelung/Nesting sichtbar (Rack in Raum, Zone in Halle etc.)**
- **Edges zu Area-IDs waren entfernt, aber Context, was valide ist, bleibt kritisch für weiteres JSON-Model**
- **Manche Geräte werden nicht korrekt als Child gerendert oder erscheinen neben den Areas**
- **Nesting (Area in Area, Devices in Areas) rein semantisch, nicht wirklich visuell abgebildet**

---

## Bisher Erreichte Verbesserungen

- Devices werden eingelesen, Ports als Handles, Edge-Rendering funktioniert wieder
- Areas sind wieder differenzierte Background-Container ohne Ports
- Fehlerhafte Edges (target=Area statt Node) werden validiert und nicht mehr zugelassen
- Compound-Modell/Tree für Areas mit Parent/Child funktioniert semantisch in der Datenstruktur

---

## Offene Anforderungen

1. **Labels auf Areas sichtbar machen (zentriert, group node label)**
2. **React Flow Parent/Child sticky behavior**: Nodes müssen beim Draggen in Areas verweilen
3. **Autoscaling & Bounding von Areas (Größe dynamisch nach Devices, inkl. Padding)**
4. **Visuelle Darstellung von Area-Nesting und Recursion**
5. **Weitere Fehler im Demo-Graph erkennen/validieren (z.B. alle edges nur zwischen Device-Nodes)**

---

## Kontext-Files
- Siehe aktuelle `src/components/AVWiringViewer.tsx`, `src/lib/elkMapper.ts`, `src/data/sampleGraph.json`, `src/components/nodes/DeviceNode.tsx`
- [GitHub-Repo Stand 13.11.2025](https://github.com/twobeass/AVFlowView)
- Letzter Nutzer-Review (Pain Point-Liste) siehe Query/Antwortverlauf (2025-11-13)

---

## Wichtige Links / Quellen
- [React Flow Parent-Child-Relation](https://reactflow.dev/examples/interaction/parent-child-relation)
- [React Flow Subflow Example](https://reactflow.dev/examples/layout/subflow)
- [ELK.js API Reference](https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html)
- [Issue: Areas/Nesting/Sticky](https://github.com/xyflow/xyflow/discussions/3355)

---

## Nächste Entwicklungsschritte

- React Flow Group-Node Parent/Child so umsetzen, dass keine Devices aus Areas rausgezogen werden können 
- Viewport/fitView so anpassen, dass ALLE geschachtelten Devices/Areas optimal sichtbar sind
- Autosizing, Area-Dynamik (keine absolute width/height vorgeben, sondern über Content)
- Best Practice aus reactflow.dev Examples implementieren (Nesting/Subflow)
- Viewer-UX Feinschliff für Produktionsreife
