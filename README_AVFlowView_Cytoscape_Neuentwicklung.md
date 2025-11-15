# AVFlowView Neuentwicklung mit Cytoscape.js – Implementation Guide für AI Code Agent

---

## Projektübersicht

**Ziel:** Vollständige Neuentwicklung einer React/TypeScript-Anwendung zur Visualisierung von A/V-Wiring-Graphen mit Cytoscape.js als Graph-Engine.

**Technologie-Stack (VERPFLICHTEND):**
- React 18.x mit TypeScript 5.x
- Cytoscape.js 3.x
- Zustand für State Management (alternativ Redux Toolkit)
- Vite als Build-Tool
- Vitest für Unit Tests
- ESLint + Prettier (Config siehe unten)

**Repository-Struktur (EINZUHALTEN):**
```
AVFlowView/
├── src/
│   ├── components/
│   │   ├── graph/
│   │   │   ├── CytoscapeGraph.tsx
│   │   │   ├── NodeRenderer.tsx
│   │   │   └── EdgeRenderer.tsx
│   │   ├── ui/
│   │   │   ├── FilterPanel.tsx
│   │   │   ├── ZoomControls.tsx
│   │   │   └── ContextMenu.tsx
│   │   └── layout/
│   ├── hooks/
│   ├── store/
│   ├── types/
│   │   └── graph.types.ts
│   ├── schemas/
│   │   └── av-wiring-graph.schema.json
│   ├── utils/
│   │   ├── validation.ts
│   │   ├── graphTransform.ts
│   │   └── layoutEngine.ts
│   └── workers/
│       └── layout.worker.ts
├── tests/
└── docs/
```

---

## Phase 1: Projekt-Setup (TASK 1)

### 1.1 Vite-Projekt initialisieren

**Befehl:**
```bash
npm create vite@latest AVFlowView -- --template react-ts
cd AVFlowView
```

**Zu installierende Dependencies:**
```bash
npm install cytoscape zustand ajv
npm install -D @types/cytoscape vitest @testing-library/react @testing-library/jest-dom eslint prettier
```

### 1.2 ESLint & Prettier konfigurieren

**Datei: `.eslintrc.json`**
```json
{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:react/recommended"],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/explicit-function-return-type": "error",
    "react/react-in-jsx-scope": "off"
  }
}
```

**Datei: `.prettierrc`**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### 1.3 Git initialisieren und erste Commits

**Befehle:**
```bash
git init
git add .
git commit -m "Initial project setup with Vite, React, TypeScript"
```

**VALIDIERUNG:** Projekt muss mit `npm run dev` fehlerfrei starten.

---

## Phase 2: TypeScript-Typen aus JSON-Schema generieren (TASK 2)

### 2.1 Schema-Datei kopieren
**WICHTIG:** Das offizielle Schema befindet sich unter `src/schemas/av-wiring-graph.schema.json`. Diese Datei MUSS die Grundlage aller Typdefinitionen sein.

### 2.2 TypeScript-Typen definieren
**Datei: `src/types/graph.types.ts`**
```typescript
// Basis-Typen aus Schema
export type PortAlignment = 'In' | 'Out' | 'Bidirectional';
export type PortGender = 'M' | 'F' | 'N/A';
export type NodeStatus = 'Existing' | 'Regular' | 'Defect';
export type LayoutDirection = 'LR' | 'TB';
export type PortBinding = 'auto' | 'exact';

export interface Port {
  alignment: PortAlignment;
  label: string;
  type: string; // z.B. "USB-C", "XLR", "SDI", "HDMI"
  gender: PortGender;
  metadata?: Record<string, unknown>;
}

export interface Node {
  id: string; // Pattern: ^[A-Za-z0-9._:-]+$
  manufacturer: string;
  model: string;
  category: string;
  subcategory?: string;
  status: NodeStatus;
  label?: string;
  areaId?: string;
  ports: Record<string, Port>; // Key = Port-ID, Value = Port-Objekt
  metadata?: Record<string, unknown>;
}

export interface Edge {
  id: string; // Pattern: ^[A-Za-z0-9._:-]+$
  wireId?: string;
  category?: string;
  subcategory?: string;
  cableType?: string; // z.B. "CAT7", "Fiber", "HDMI"
  label?: string;
  source: string; // Node-ID
  sourcePortKey?: string; // Port-Key im Source-Node
  target: string; // Node-ID
  targetPortKey?: string; // Port-Key im Target-Node
  binding?: PortBinding;
  metadata?: Record<string, unknown>;
}

export interface Area {
  id: string; // Pattern: ^[A-Za-z0-9._:-]+$
  label: string;
  parentId?: string;
  metadata?: Record<string, unknown>;
}

export interface LayoutConfig {
  direction?: LayoutDirection;
  portBinding?: PortBinding;
  areaFirst?: boolean;
  areaPadding?: number;
}

export interface AVWiringGraph {
  layout?: LayoutConfig;
  areas?: Area[];
  nodes: Node[];
  edges: Edge[];
  metadata?: Record<string, unknown>;
}
```
**VALIDIERUNG:** TypeScript-Compiler darf keine Fehler zeigen.

### 2.3 Schema-Validator implementieren
**Datei: `src/utils/validation.ts`**
```typescript
import Ajv, { ValidateFunction } from 'ajv';
import { AVWiringGraph } from '../types/graph.types';
import schema from '../schemas/av-wiring-graph.schema.json';

const ajv = new Ajv({ strict: false });
const validateGraph: ValidateFunction = ajv.compile(schema);

export function validateAVWiringGraph(data: unknown): data is AVWiringGraph {
  const valid = validateGraph(data);
  if (!valid) {
    console.error('Validation errors:', validateGraph.errors);
    return false;
  }
  return true;
}

export function getValidationErrors(): string[] {
  if (!validateGraph.errors) return [];
  return validateGraph.errors.map(
    (err) => `${err.instancePath} ${err.message}`
  );
}
```
**TEST ERFORDERLICH:** Unit-Test schreiben, der valide und invalide JSON-Dateien validiert.

---

## Phase 3: State Management (TASK 3)

### 3.1 Zustand Store erstellen
**Datei: `src/store/graphStore.ts`
```
import { create } from 'zustand';
import { AVWiringGraph, Node, Edge } from '../types/graph.types';

interface GraphState {
  graph: AVWiringGraph | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  filterCategories: string[];
  zoomLevel: number;
  // Actions
  loadGraph: (graph: AVWiringGraph) => void;
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  setFilterCategories: (categories: string[]) => void;
  setZoomLevel: (level: number) => void;
  resetGraph: () => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  graph: null,
  selectedNodeId: null,
  selectedEdgeId: null,
  filterCategories: [],
  zoomLevel: 1,
  loadGraph: (graph) => {
    set({ graph, selectedNodeId: null, selectedEdgeId: null });
  },
  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId, selectedEdgeId: null });
  },
  selectEdge: (edgeId) => {
    set({ selectedEdgeId: edgeId, selectedNodeId: null });
  },
  setFilterCategories: (categories) => {
    set({ filterCategories: categories });
  },
  setZoomLevel: (level) => {
    set({ zoomLevel: level });
  },
  resetGraph: () => {
    set({ graph: null, selectedNodeId: null, selectedEdgeId: null, filterCategories: [], zoomLevel: 1 });
  },
}));
```
**VALIDIERUNG:** Store muss in React-Komponenten ohne Fehler importierbar sein.

---

## Phase 4: Cytoscape.js Integration (TASK 4)

### 4.1 Graph-Transformation implementieren
**Datei: `src/utils/graphTransform.ts`

**KRITISCH:** Diese Funktion wandelt das JSON-Schema in Cytoscape-kompatible Datenstruktur um.
```typescript
import { AVWiringGraph, Node as AVNode, Edge as AVEdge } from '../types/graph.types';
import { ElementDefinition } from 'cytoscape';

export function transformToCytoscapeElements(graph: AVWiringGraph): ElementDefinition[] {
  const elements: ElementDefinition[] = [];
  graph.nodes.forEach((node: AVNode) => {
    elements.push({
      data: {
        id: node.id,
        label: node.label || `${node.manufacturer} ${node.model}`,
        category: node.category,
        status: node.status,
        ports: node.ports,
        areaId: node.areaId,
        manufacturer: node.manufacturer,
        model: node.model
      },
      classes: `node-${node.category} status-${node.status}`
    });
    Object.entries(node.ports).forEach(([portKey, port]) => {
      elements.push({
        data: {
          id: `${node.id}:${portKey}`,
          label: port.label,
          parent: node.id,
          portAlignment: port.alignment,
          portType: port.type,
          portGender: port.gender
        },
        classes: 'port'
      });
    });
  });
  graph.edges.forEach((edge: AVEdge) => {
    const sourceId = edge.sourcePortKey ? `${edge.source}:${edge.sourcePortKey}` : edge.source;
    const targetId = edge.targetPortKey ? `${edge.target}:${edge.targetPortKey}` : edge.target;
    elements.push({
      data: {
        id: edge.id,
        source: sourceId,
        target: targetId,
        label: edge.label || edge.wireId,
        category: edge.category,
        cableType: edge.cableType
      },
      classes: `edge-${edge.category || 'default'}`
    });
  });
  if (graph.areas) {
    graph.areas.forEach((area) => {
      elements.push({
        data: {
          id: area.id,
          label: area.label,
          parent: area.parentId
        },
        classes: 'area'
      });
    });
  }
  return elements;
}
```
**ERROR HANDLING:** Wenn `node.id` oder `edge.id` nicht dem Pattern `^[A-Za-z0-9._:-]+$` entspricht → Fehler werfen; Wenn `edge.source` oder `edge.target` nicht existiert → Fehler werfen

### 4.2 Cytoscape React-Komponente
**Datei: `src/components/graph/CytoscapeGraph.tsx`
```typescript
import React, { useEffect, useRef } from 'react';
import cytoscape, { Core, EdgeSingular, NodeSingular } from 'cytoscape';
import { useGraphStore } from '../../store/graphStore';
import { transformToCytoscapeElements } from '../../utils/graphTransform';

interface CytoscapeGraphProps {
  layoutName?: string;
  width?: string;
  height?: string;
}

export const CytoscapeGraph: React.FC<CytoscapeGraphProps> = ({ layoutName = 'cose', width = '100%', height = '800px' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const { graph, selectNode, selectEdge } = useGraphStore();
  useEffect(() => {
    if (!containerRef.current || !graph) return;
    const cy = cytoscape({
      container: containerRef.current,
      elements: transformToCytoscapeElements(graph),
      style: [
        { selector: 'node', style: { 'background-color': '#0074D9', label: 'data(label)', 'text-valign': 'center', 'text-halign': 'center', width: 80, height: 60, 'font-size': 12 } },
        { selector: 'node.status-Defect', style: { 'background-color': '#FF4136' } },
        { selector: 'node.area', style: { 'background-color': '#f0f0f0', 'border-width': 2, 'border-color': '#999' } },
        { selector: 'edge', style: { width: 3, 'line-color': '#888', 'target-arrow-color': '#888', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', label: 'data(label)', 'font-size': 10 } },
        { selector: ':selected', style: { 'background-color': '#FF851B', 'line-color': '#FF851B' } }
      ],
      layout: { name: layoutName }
    });
    cyRef.current = cy;
    cy.on('tap', 'node', (evt) => { const node: NodeSingular = evt.target; selectNode(node.id()); });
    cy.on('tap', 'edge', (evt) => { const edge: EdgeSingular = evt.target; selectEdge(edge.id()); });
    return () => { cy.destroy(); };
  }, [graph, layoutName, selectNode, selectEdge]);
  return <div ref={containerRef} style={{ width, height }} />;
};
```
**KRITISCHE ANFORDERUNGEN:** Cytoscape-Instanz MUSS im `useEffect` mit Cleanup zerstört werden; Event-Handler MÜSSEN auf `useGraphStore` reagieren; Styles MÜSSEN Schema-Status (`Existing`, `Regular`, `Defect`) widerspiegeln

---

## Weitere Phasen und Anforderungen

(Siehe ursprüngliche, im vorherigen Abschnitt gelistete Inhalte für weitere Detailphasen, Layout, UI, Testing, Deployment, Akzeptanzkriterien und Fehlerfälle.)

---

Dieses Dokument wurde aktualisiert und erweitert, damit ein AI Code Agent alle kritischen Aufgaben, Strukturen, und Validierungen wie gefordert unmittelbar und eindeutig versteht und umsetzen kann.