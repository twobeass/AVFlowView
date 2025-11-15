# AVFlowView Cytoscape.js Redevelopment - AI Agent Implementation Guide

## Project Overview

**Objective:** Complete redevelopment of a React/TypeScript application for visualizing A/V wiring graphs using Cytoscape.js as the graph rendering engine.

**Mandatory Technology Stack:**
- React 18.x with TypeScript 5.x
- Cytoscape.js 3.x
- Zustand for state management (alternative: Redux Toolkit)
- Vite as build tool
- Vitest for unit testing
- ESLint + Prettier (configuration provided below)

**Repository Structure (MUST BE FOLLOWED):**
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

## TASK 1: Project Setup

### 1.1 Initialize Vite Project

**Command:**
```bash
npm create vite@latest AVFlowView -- --template react-ts
cd AVFlowView
```

### 1.2 Install Dependencies

**Required packages:**
```bash
npm install cytoscape zustand ajv
npm install -D @types/cytoscape vitest @testing-library/react @testing-library/jest-dom eslint prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react
```

### 1.3 Configure ESLint

**File:** `.eslintrc.json`
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": ["@typescript-eslint", "react"],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/explicit-function-return-type": "error",
    "react/react-in-jsx-scope": "off"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

### 1.4 Configure Prettier

**File:** `.prettierrc`
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### 1.5 Configure Vitest

**File:** `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
});
```

### 1.6 Create Test Setup File

**File:** `tests/setup.ts`
```typescript
import '@testing-library/jest-dom';
```

### 1.7 Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial project setup with Vite, React, TypeScript"
```

**Validation Criteria:** Project must start without errors using `npm run dev`.

---

## TASK 2: TypeScript Type Definitions from JSON Schema

### 2.1 Schema File Location

**Critical:** The official JSON schema is located at `src/schemas/av-wiring-graph.schema.json`. This file MUST be the foundation for all type definitions.

### 2.2 Define TypeScript Types

**File:** `src/types/graph.types.ts`

```typescript
// Core enum types from schema
export type PortAlignment = 'In' | 'Out' | 'Bidirectional';
export type PortGender = 'M' | 'F' | 'N/A';
export type NodeStatus = 'Existing' | 'Regular' | 'Defect';
export type LayoutDirection = 'LR' | 'TB';
export type PortBinding = 'auto' | 'exact';

/**
 * Represents a single port on a device node
 */
export interface Port {
  alignment: PortAlignment;
  label: string;
  type: string; // Examples: "USB-C", "XLR", "SDI", "HDMI"
  gender: PortGender;
  metadata?: Record<string, unknown>;
}

/**
 * Represents a device node in the A/V wiring graph
 */
export interface Node {
  id: string; // Must match pattern: ^[A-Za-z0-9._:-]+$
  manufacturer: string;
  model: string;
  category: string;
  subcategory?: string;
  status: NodeStatus;
  label?: string;
  areaId?: string;
  ports: Record<string, Port>; // Key = Port ID, Value = Port object
  metadata?: Record<string, unknown>;
}

/**
 * Represents a connection/cable between two nodes or ports
 */
export interface Edge {
  id: string; // Must match pattern: ^[A-Za-z0-9._:-]+$
  wireId?: string;
  category?: string;
  subcategory?: string;
  cableType?: string; // Examples: "CAT7", "Fiber", "HDMI"
  label?: string;
  source: string; // Node ID
  sourcePortKey?: string; // Port key in source node
  target: string; // Node ID
  targetPortKey?: string; // Port key in target node
  binding?: PortBinding;
  metadata?: Record<string, unknown>;
}

/**
 * Represents a logical or physical area grouping nodes
 */
export interface Area {
  id: string; // Must match pattern: ^[A-Za-z0-9._:-]+$
  label: string;
  parentId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for graph layout algorithm
 */
export interface LayoutConfig {
  direction?: LayoutDirection;
  portBinding?: PortBinding;
  areaFirst?: boolean;
  areaPadding?: number;
}

/**
 * Root structure for A/V wiring graph
 */
export interface AVWiringGraph {
  layout?: LayoutConfig;
  areas?: Area[];
  nodes: Node[];
  edges: Edge[];
  metadata?: Record<string, unknown>;
}
```

**Validation Criteria:** TypeScript compiler must compile without errors.

### 2.3 Implement Schema Validator

**File:** `src/utils/validation.ts`

```typescript
import Ajv, { ValidateFunction } from 'ajv';
import { AVWiringGraph } from '../types/graph.types';
import schema from '../schemas/av-wiring-graph.schema.json';

const ajv = new Ajv({ strict: false });
const validateGraph: ValidateFunction = ajv.compile(schema);

/**
 * Validates data against the AVWiringGraph JSON schema
 * @param data - Data to validate
 * @returns True if data is valid AVWiringGraph
 */
export function validateAVWiringGraph(data: unknown): data is AVWiringGraph {
  const valid = validateGraph(data);
  if (!valid) {
    console.error('Validation errors:', validateGraph.errors);
    return false;
  }
  return true;
}

/**
 * Returns human-readable validation error messages
 * @returns Array of error messages
 */
export function getValidationErrors(): string[] {
  if (!validateGraph.errors) return [];
  return validateGraph.errors.map(
    (err) => `${err.instancePath} ${err.message}`
  );
}
```

### 2.4 Create Unit Tests for Validation

**File:** `tests/validation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { validateAVWiringGraph, getValidationErrors } from '../src/utils/validation';
import { AVWiringGraph } from '../src/types/graph.types';

describe('AVWiringGraph Validation', () => {
  it('should validate correct graph structure', () => {
    const validGraph: AVWiringGraph = {
      nodes: [
        {
          id: 'node1',
          manufacturer: 'Manufacturer A',
          model: 'Model X',
          category: 'Audio',
          status: 'Regular',
          ports: {
            port1: {
              alignment: 'In',
              label: 'Input 1',
              type: 'XLR',
              gender: 'F'
            }
          }
        }
      ],
      edges: [
        {
          id: 'edge1',
          source: 'node1',
          target: 'node2',
          sourcePortKey: 'port1'
        }
      ]
    };

    expect(validateAVWiringGraph(validGraph)).toBe(true);
  });

  it('should reject invalid node ID pattern', () => {
    const invalidGraph = {
      nodes: [
        {
          id: 'invalid node!', // Contains space and special char
          manufacturer: 'Test',
          model: 'Test',
          category: 'Test',
          status: 'Regular',
          ports: {}
        }
      ],
      edges: []
    };

    expect(validateAVWiringGraph(invalidGraph)).toBe(false);
  });

  it('should reject missing required fields', () => {
    const invalidGraph = {
      nodes: [
        {
          id: 'node1',
          // Missing manufacturer, model, category
          status: 'Regular',
          ports: {}
        }
      ],
      edges: []
    };

    expect(validateAVWiringGraph(invalidGraph)).toBe(false);
  });
});
```

**Test Requirement:** All unit tests must pass before proceeding.

---

## TASK 3: State Management Implementation

### 3.1 Create Zustand Store

**File:** `src/store/graphStore.ts`

```typescript
import { create } from 'zustand';
import { AVWiringGraph } from '../types/graph.types';

interface GraphState {
  // State
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
  // Initial state
  graph: null,
  selectedNodeId: null,
  selectedEdgeId: null,
  filterCategories: [],
  zoomLevel: 1,
  
  // Actions
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
    set({
      graph: null,
      selectedNodeId: null,
      selectedEdgeId: null,
      filterCategories: [],
      zoomLevel: 1
    });
  },
}));
```

**Validation Criteria:** Store must be importable in React components without errors.

### 3.2 Create Store Tests

**File:** `tests/graphStore.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useGraphStore } from '../src/store/graphStore';
import { AVWiringGraph } from '../src/types/graph.types';

describe('Graph Store', () => {
  beforeEach(() => {
    useGraphStore.getState().resetGraph();
  });

  it('should initialize with default state', () => {
    const state = useGraphStore.getState();
    expect(state.graph).toBeNull();
    expect(state.selectedNodeId).toBeNull();
    expect(state.zoomLevel).toBe(1);
  });

  it('should load graph and clear selections', () => {
    const mockGraph: AVWiringGraph = {
      nodes: [],
      edges: []
    };

    useGraphStore.getState().loadGraph(mockGraph);
    const state = useGraphStore.getState();
    
    expect(state.graph).toBe(mockGraph);
    expect(state.selectedNodeId).toBeNull();
    expect(state.selectedEdgeId).toBeNull();
  });

  it('should select node and clear edge selection', () => {
    useGraphStore.getState().selectNode('node1');
    const state = useGraphStore.getState();
    
    expect(state.selectedNodeId).toBe('node1');
    expect(state.selectedEdgeId).toBeNull();
  });
});
```

---

## TASK 4: Cytoscape.js Integration

### 4.1 Implement Graph Transformation

**File:** `src/utils/graphTransform.ts`

**Critical:** This function transforms the JSON schema into Cytoscape-compatible data structures.

```typescript
import { AVWiringGraph, Node as AVNode, Edge as AVEdge } from '../types/graph.types';
import { ElementDefinition } from 'cytoscape';

/**
 * Validates that an ID matches the required pattern
 * @throws Error if ID is invalid
 */
function validateId(id: string, type: string): void {
  const pattern = /^[A-Za-z0-9._:-]+$/;
  if (!pattern.test(id)) {
    throw new Error(`Invalid ${type} ID: "${id}". Must match pattern ^[A-Za-z0-9._:-]+$`);
  }
}

/**
 * Validates that referenced nodes exist in the graph
 * @throws Error if node reference is invalid
 */
function validateNodeReference(nodeId: string, nodes: AVNode[]): void {
  const nodeExists = nodes.some(n => n.id === nodeId);
  if (!nodeExists) {
    throw new Error(`Referenced node "${nodeId}" does not exist in graph`);
  }
}

/**
 * Validates that referenced port exists in a node
 * @throws Error if port reference is invalid
 */
function validatePortReference(nodeId: string, portKey: string, node: AVNode): void {
  if (!node.ports[portKey]) {
    throw new Error(`Referenced port "${portKey}" does not exist in node "${nodeId}"`);
  }
}

/**
 * Transforms AVWiringGraph to Cytoscape.js element definitions
 * @param graph - The A/V wiring graph to transform
 * @returns Array of Cytoscape element definitions
 * @throws Error if validation fails
 */
export function transformToCytoscapeElements(graph: AVWiringGraph): ElementDefinition[] {
  const elements: ElementDefinition[] = [];
  
  // Transform areas first (if they exist)
  if (graph.areas) {
    graph.areas.forEach((area) => {
      validateId(area.id, 'area');
      
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
  
  // Transform nodes
  graph.nodes.forEach((node: AVNode) => {
    validateId(node.id, 'node');
    
    elements.push({
      data: {
        id: node.id,
        label: node.label || `${node.manufacturer} ${node.model}`,
        category: node.category,
        subcategory: node.subcategory,
        status: node.status,
        ports: node.ports,
        areaId: node.areaId,
        manufacturer: node.manufacturer,
        model: node.model,
        metadata: node.metadata
      },
      classes: `node-${node.category} status-${node.status}`,
      ...(node.areaId && { parent: node.areaId })
    });
    
    // Transform ports as child nodes
    Object.entries(node.ports).forEach(([portKey, port]) => {
      const portId = `${node.id}:${portKey}`;
      
      elements.push({
        data: {
          id: portId,
          label: port.label,
          parent: node.id,
          portAlignment: port.alignment,
          portType: port.type,
          portGender: port.gender,
          portKey: portKey,
          metadata: port.metadata
        },
        classes: `port port-${port.alignment}`
      });
    });
  });
  
  // Transform edges
  graph.edges.forEach((edge: AVEdge) => {
    validateId(edge.id, 'edge');
    validateNodeReference(edge.source, graph.nodes);
    validateNodeReference(edge.target, graph.nodes);
    
    const sourceNode = graph.nodes.find(n => n.id === edge.source);
    const targetNode = graph.nodes.find(n => n.id === edge.target);
    
    // Validate port references if specified
    if (edge.sourcePortKey && sourceNode) {
      validatePortReference(edge.source, edge.sourcePortKey, sourceNode);
    }
    if (edge.targetPortKey && targetNode) {
      validatePortReference(edge.target, edge.targetPortKey, targetNode);
    }
    
    // Build source and target IDs (with port keys if specified)
    const sourceId = edge.sourcePortKey 
      ? `${edge.source}:${edge.sourcePortKey}` 
      : edge.source;
    const targetId = edge.targetPortKey 
      ? `${edge.target}:${edge.targetPortKey}` 
      : edge.target;
      
    elements.push({
      data: {
        id: edge.id,
        source: sourceId,
        target: targetId,
        label: edge.label || edge.wireId,
        category: edge.category,
        subcategory: edge.subcategory,
        cableType: edge.cableType,
        wireId: edge.wireId,
        binding: edge.binding,
        metadata: edge.metadata
      },
      classes: `edge edge-${edge.category || 'default'}`
    });
  });
  
  return elements;
}
```

### 4.2 Create Transformation Tests

**File:** `tests/graphTransform.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { transformToCytoscapeElements } from '../src/utils/graphTransform';
import { AVWiringGraph } from '../src/types/graph.types';

describe('Graph Transformation', () => {
  it('should transform valid graph to Cytoscape elements', () => {
    const graph: AVWiringGraph = {
      nodes: [
        {
          id: 'node1',
          manufacturer: 'Sony',
          model: 'Camera1',
          category: 'Video',
          status: 'Regular',
          ports: {
            out1: {
              alignment: 'Out',
              label: 'SDI Out',
              type: 'SDI',
              gender: 'M'
            }
          }
        }
      ],
      edges: []
    };

    const elements = transformToCytoscapeElements(graph);
    expect(elements.length).toBeGreaterThan(0);
    expect(elements[0].data.id).toBe('node1');
  });

  it('should throw error for invalid node ID', () => {
    const graph: AVWiringGraph = {
      nodes: [
        {
          id: 'invalid id!',
          manufacturer: 'Test',
          model: 'Test',
          category: 'Test',
          status: 'Regular',
          ports: {}
        }
      ],
      edges: []
    };

    expect(() => transformToCytoscapeElements(graph)).toThrow();
  });

  it('should throw error for non-existent node reference', () => {
    const graph: AVWiringGraph = {
      nodes: [
        {
          id: 'node1',
          manufacturer: 'Test',
          model: 'Test',
          category: 'Test',
          status: 'Regular',
          ports: {}
        }
      ],
      edges: [
        {
          id: 'edge1',
          source: 'node1',
          target: 'nonexistent'
        }
      ]
    };

    expect(() => transformToCytoscapeElements(graph)).toThrow();
  });
});
```

### 4.3 Create Cytoscape React Component

**File:** `src/components/graph/CytoscapeGraph.tsx`

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

/**
 * Main Cytoscape.js graph visualization component
 */
export const CytoscapeGraph: React.FC<CytoscapeGraphProps> = ({
  layoutName = 'cose',
  width = '100%',
  height = '800px'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const { graph, selectNode, selectEdge, setZoomLevel } = useGraphStore();
  
  useEffect(() => {
    if (!containerRef.current || !graph) return;
    
    try {
      const cy = cytoscape({
        container: containerRef.current,
        elements: transformToCytoscapeElements(graph),
        style: [
          // Base node style
          {
            selector: 'node',
            style: {
              'background-color': '#0074D9',
              label: 'data(label)',
              'text-valign': 'center',
              'text-halign': 'center',
              width: 80,
              height: 60,
              'font-size': 12,
              'text-wrap': 'wrap',
              'text-max-width': '75px'
            }
          },
          // Status-based styling
          {
            selector: 'node.status-Existing',
            style: {
              'background-color': '#2ECC40'
            }
          },
          {
            selector: 'node.status-Regular',
            style: {
              'background-color': '#0074D9'
            }
          },
          {
            selector: 'node.status-Defect',
            style: {
              'background-color': '#FF4136'
            }
          },
          // Area styling
          {
            selector: 'node.area',
            style: {
              'background-color': '#f0f0f0',
              'background-opacity': 0.3,
              'border-width': 2,
              'border-color': '#999',
              shape: 'roundrectangle'
            }
          },
          // Port styling
          {
            selector: 'node.port',
            style: {
              width: 20,
              height: 20,
              'background-color': '#AAAAAA',
              'font-size': 8
            }
          },
          {
            selector: 'node.port-In',
            style: {
              'background-color': '#39CCCC'
            }
          },
          {
            selector: 'node.port-Out',
            style: {
              'background-color': '#FF851B'
            }
          },
          {
            selector: 'node.port-Bidirectional',
            style: {
              'background-color': '#B10DC9'
            }
          },
          // Edge styling
          {
            selector: 'edge',
            style: {
              width: 3,
              'line-color': '#888',
              'target-arrow-color': '#888',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              label: 'data(label)',
              'font-size': 10,
              'text-rotation': 'autorotate'
            }
          },
          // Selection styling
          {
            selector: ':selected',
            style: {
              'background-color': '#FF851B',
              'line-color': '#FF851B',
              'target-arrow-color': '#FF851B',
              'border-width': 3,
              'border-color': '#FF851B'
            }
          }
        ],
        layout: { name: layoutName }
      });
      
      cyRef.current = cy;
      
      // Event handlers
      cy.on('tap', 'node', (evt) => {
        const node: NodeSingular = evt.target;
        if (!node.hasClass('port')) {
          selectNode(node.id());
        }
      });
      
      cy.on('tap', 'edge', (evt) => {
        const edge: EdgeSingular = evt.target;
        selectEdge(edge.id());
      });
      
      // Zoom event handler
      cy.on('zoom', () => {
        setZoomLevel(cy.zoom());
      });
      
      // Clear selection on background tap
      cy.on('tap', (evt) => {
        if (evt.target === cy) {
          selectNode(null);
          selectEdge(null);
        }
      });
      
      return () => {
        cy.destroy();
      };
    } catch (error) {
      console.error('Error initializing Cytoscape:', error);
    }
  }, [graph, layoutName, selectNode, selectEdge, setZoomLevel]);
  
  return (
    <div 
      ref={containerRef} 
      style={{ 
        width, 
        height,
        border: '1px solid #ccc',
        borderRadius: '4px'
      }} 
    />
  );
};
```

**Critical Requirements:**
- Cytoscape instance MUST be destroyed in cleanup function
- Event handlers MUST integrate with `useGraphStore`
- Styles MUST reflect all schema status values (`Existing`, `Regular`, `Defect`)
- Component must handle errors gracefully
- All TypeScript types must be properly defined

---

## TASK 5: UI Components

### 5.1 Zoom Controls Component

**File:** `src/components/ui/ZoomControls.tsx`

```typescript
import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

interface ZoomControlsProps {
  cyInstance: cytoscape.Core | null;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({ cyInstance }) => {
  const handleZoomIn = (): void => {
    if (cyInstance) {
      cyInstance.zoom(cyInstance.zoom() * 1.2);
      cyInstance.center();
    }
  };

  const handleZoomOut = (): void => {
    if (cyInstance) {
      cyInstance.zoom(cyInstance.zoom() * 0.8);
      cyInstance.center();
    }
  };

  const handleFit = (): void => {
    if (cyInstance) {
      cyInstance.fit();
    }
  };

  return (
    <div style={{ 
      position: 'absolute', 
      top: '10px', 
      right: '10px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '8px',
      zIndex: 1000
    }}>
      <button onClick={handleZoomIn} style={buttonStyle}>+</button>
      <button onClick={handleZoomOut} style={buttonStyle}>-</button>
      <button onClick={handleFit} style={buttonStyle}>Fit</button>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  fontSize: '18px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  backgroundColor: 'white',
  cursor: 'pointer',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};
```

### 5.2 Filter Panel Component

**File:** `src/components/ui/FilterPanel.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useGraphStore } from '../../store/graphStore';

export const FilterPanel: React.FC = () => {
  const { graph, filterCategories, setFilterCategories } = useGraphStore();
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!graph) return;
    
    // Extract unique categories from nodes
    const categories = new Set<string>();
    graph.nodes.forEach(node => {
      if (node.category) categories.add(node.category);
    });
    
    setAvailableCategories(Array.from(categories).sort());
  }, [graph]);

  const handleCategoryToggle = (category: string): void => {
    if (filterCategories.includes(category)) {
      setFilterCategories(filterCategories.filter(c => c !== category));
    } else {
      setFilterCategories([...filterCategories, category]);
    }
  };

  if (!graph || availableCategories.length === 0) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      padding: '16px',
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      zIndex: 1000,
      maxWidth: '200px'
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Filter by Category</h3>
      {availableCategories.map(category => (
        <label key={category} style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={filterCategories.includes(category)}
            onChange={() => handleCategoryToggle(category)}
            style={{ marginRight: '8px' }}
          />
          {category}
        </label>
      ))}
    </div>
  );
};
```

---

## TASK 6: Main Application Assembly

### 6.1 Main App Component

**File:** `src/App.tsx`

```typescript
import React, { useState } from 'react';
import { CytoscapeGraph } from './components/graph/CytoscapeGraph';
import { FilterPanel } from './components/ui/FilterPanel';
import { useGraphStore } from './store/graphStore';
import { validateAVWiringGraph } from './utils/validation';
import { AVWiringGraph } from './types/graph.types';

function App(): JSX.Element {
  const { loadGraph, graph } = useGraphStore();
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (validateAVWiringGraph(data)) {
          loadGraph(data as AVWiringGraph);
          setError(null);
        } else {
          setError('Invalid graph data format');
        }
      } catch (err) {
        setError(`Error loading file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <header style={{
        padding: '16px',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #ddd'
      }}>
        <h1 style={{ margin: '0 0 12px 0', fontSize: '24px' }}>AVFlowView</h1>
        <input
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          style={{ marginBottom: '8px' }}
        />
        {error && (
          <div style={{ color: 'red', fontSize: '14px', marginTop: '8px' }}>
            {error}
          </div>
        )}
      </header>
      
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: 'calc(100vh - 100px)' 
      }}>
        {graph ? (
          <>
            <FilterPanel />
            <CytoscapeGraph layoutName="cose" />
          </>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#666'
          }}>
            Upload a graph JSON file to visualize
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
```

### 6.2 Update Main Entry Point

**File:** `src/main.tsx`

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## TASK 7: Testing Strategy

### 7.1 Test Coverage Requirements

**Minimum coverage targets:**
- Utility functions: 90%
- Store logic: 85%
- Component rendering: 70%

### 7.2 Run Tests

```bash
npm run test
```

**All tests must pass before deployment.**

---

## TASK 8: Build and Deployment

### 8.1 Production Build

```bash
npm run build
```

### 8.2 Preview Production Build

```bash
npm run preview
```

### 8.3 Build Validation

**Criteria:**
- No TypeScript errors
- No ESLint errors
- All tests passing
- Bundle size < 500KB (gzipped)

---

## Error Handling Requirements

### Critical Error Scenarios

1. **Invalid Graph Data:**
   - Display user-friendly error message
   - Show validation errors in console
   - Prevent graph rendering

2. **Missing Node References:**
   - Throw descriptive error during transformation
   - Log stack trace for debugging

3. **Invalid ID Patterns:**
   - Validate before transformation
   - Reject with clear error message

4. **Port Reference Errors:**
   - Validate port existence
   - Provide node and port details in error

---

## Acceptance Criteria

### Functional Requirements

- [ ] Application loads without errors
- [ ] JSON file upload works correctly
- [ ] Graph validates against schema
- [ ] Nodes render with correct styling based on status
- [ ] Edges connect correct source/target nodes and ports
- [ ] Areas group nodes correctly
- [ ] Selection highlights nodes/edges
- [ ] Filter panel filters by category
- [ ] Zoom controls work properly
- [ ] TypeScript compiles without errors
- [ ] All unit tests pass
- [ ] ESLint shows no errors

### Performance Requirements

- [ ] Graph with 100 nodes renders in < 2 seconds
- [ ] Graph with 500 nodes renders in < 5 seconds
- [ ] No memory leaks on repeated graph loading
- [ ] Smooth zoom and pan operations

---

## Agent Execution Checklist

Execute tasks in order. After each task:

1. ✅ Verify all files created
2. ✅ Run `npm run build` successfully
3. ✅ Run `npm run test` - all tests pass
4. ✅ Check TypeScript compilation - zero errors
5. ✅ Check ESLint - zero errors
6. ✅ Commit changes with descriptive message

**Do not proceed to next task until current task validation passes.**

---

## Additional Notes for AI Agent

- **Never skip error handling** - All functions must handle edge cases
- **Always use TypeScript strict mode** - No `any` types without justification
- **Document all public APIs** - Use JSDoc comments
- **Follow naming conventions** - camelCase for functions/variables, PascalCase for components/types
- **Keep components small** - Single responsibility principle
- **Test edge cases** - Invalid data, missing fields, boundary conditions
- **Performance matters** - Use React.memo for expensive renders, Web Workers for heavy computation

---

## Support Resources

- [Cytoscape.js Documentation](https://js.cytoscape.org/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Vitest Documentation](https://vitest.dev/)
