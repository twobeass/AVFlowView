# AVFlowView-D3: Autonomous Agent Implementation Playbook (Expanded)

---

**This is the authoritative master specification for re-implementing AVFlowView with D3.js, d3-hwschematic, and ELK.js.**

All information required for functional parity and agent-driven migration are now consolidated here, including critical schema details, functional algorithms, precise technical implementation, migration guidelines, and references to supplementary docs. _Do not proceed if a section is flagged as incomplete or if validation requirements are not satisfied!_

## Table of Contents
1. **Data Model & Full JSON Schema**
2. **Critical React Flow Implementation Details**
3. **Architectural/Algorithmic Essentials**
4. **D3.js/d3-hwschematic Requirements**
5. **Configuration, Styling, and Color Logic**
6. **Edge Routing & Port Placement Algorithms**
7. **Area Grouping, Node Ordering & Layout Constraints**
8. **Functional Specification Table**
9. **Testing, Error Handling, and Acceptance Criteria**
10. **Supplementary Documentation Index**

---

## 1. Data Model & Full JSON Schema
- Embed or reference the authoritative AV wiring JSON schema verbatim.
- Must specify: permissible ID patterns (e.g. ^[A-Za-z0-9._:-]+$), required/optional fields, data shape for nodes/edges/areas/ports/layout. 
- Include extensibility for metadata. 
- All data loaded MUST be schema-validated (Ajv or equivalent). Produce human-readable validation errors.

(→ See `src/schemas/av-wiring-graph.schema.json`, section excerpt below...)
```json
{
  "properties": {
    "layout": { "type": "object", "properties": { "direction": {"enum": ["LR", "TB"]}, ... } },
    "areas": { "type": "array", "items": { "id": { "pattern": "^[A-Za-z0-9._:-]+$" }, ... } },
    "nodes": { "type": "array", "items": { "id": { "pattern": "^[A-Za-z0-9._:-]+$" }, ... } },
    "edges": { "type": "array", "items": { "id": { "pattern": "^[A-Za-z0-9._:-]+$" }, ... } }
  },
  "required": ["nodes", "edges"]
}
```
- Every node, edge, port, and area must have unique IDs matching the regex above.
- All required/optional/metadata conventions are to be obeyed as in `AI_AGENT_INSTRUCTIONS.md`.

## 2. Current Implementation: Key Features

**a) Smart Edge Routing (A*)**: Existing system uses Manhattan routing with A* for collision avoidance. Candidate edges must not intersect node bounding boxes. Each edge's path (list of points) is computed globally.

**b) Bidirectional Port Placement (4-phase pipeline)**: Handles mapping, computation, propagation, and precise rendering—see below for details and the `getPortSideDynamic()` code.

**c) Centralized Color Config**: All category, status, and area color assignments are handled by a single config file (e.g., `src/config/colors.ts`).

**d) Node/Port/Area Render Layout**: Inputs left, outputs right, bi/auto-detect, area groupings with padding and dimension as specified.

**e) Focus Mode/K-Depth Selection**: Interactive highlighting of k-neighborhood around node selection, dimming all else.

## 3. Core Algorithmic Excerpts

**getPortSideDynamic (Pseudo-code):**
```typescript
function getPortSideDynamic(node, portKey, isSource) {
  // For each edge on this port, find its direction
  // Sum dx/dy, decide EAST/WEST or NORTH/SOUTH
  // Use layout direction constraints (LR→E/W, TB→N/S)
  // Only connected ports can resolve side; fallback to default
}
```
**A* Routing (for Manhattan):** Embedded in React Flow's smart edge module; refactor for d3.js if manual routing is needed.

**Color Map Example (from config):**
```typescript
export const CategoryColors = {
  Audio:   { background: '#2ECC40', border: '#15A03B' },
  Video:   { background: '#0074D9', border: '#005299' },
  Network: { background: '#FFDC00', border: '#B39700' },
  Control: { background: '#B10DC9', border: '#6D0A87' },
  Power:   { background: '#FF4136', border: '#C60F1A' },
  Default: { background: '#AAAAAA', border: '#888888' }
};
```

Pages, padding, port offset, and layer spacing are explicitly:
- Node width: 440px
- Node padding: 30px sides, 50px above
- Port-vertical spacing: 20px
- Area padding: 50px top/30px sides
- All positioning rules as in `IMPLEMENTATION_STATUS.md` and `STYLING_IMPLEMENTATION.md`.

## 4. D3.js & d3-hwschematic Guidance
- Use d3-hwschematic conventions: nodes as LNode, ports as LPort, edges as LEdge; include `hwMeta` for styling/config.
- Register custom renderers for category status, area grouping, and port direction.
- Load and parse sample graphs exhaustively as unit tests (taken from your test set).
- Use layout and edge separation options for ELK that exactly match current production config (`elk.edgeRouting`, `elk.spacing.edgeEdge`, etc.).

## 5. Functional Specification Table
| Feature                 | React Flow             | D3.js/d3-hwschematic requirement        |
|-------------------------|-----------------------|-----------------------------------------|
| Auto-Layout (ELK)       | ✅ via ELK.js         | Use ELK.js, copy all config options     |
| Orthogonal Edges        | via A*                | Use ELK's ortho routing, or replicate   |
| Category Colors         | Central config file   | Copy config, support runtime changes    |
| Side-by-side Ports      | CSS Grid, algorithmic | Dynamic d3 rendering, per computedSide  |
| Bidirectional Ports     | Dynamic, full pipeline| Implement per port/edge orientation     |
| Areas/Groups            | Group nodes, assign id| Use LNode containers, areaId, padding   |
| Focus Mode              | k-depth traversal     | BFS traversal, highlight, fade others   |
| Zoom/Pan                | React Flow UI         | Use d3-zoom, maintain performance       |
| Schema Validation       | Ajv                   | Use Ajv or equivalent, block render if invalid |
| Export/Import           | via JSON              | Should match               |

## 6. Migration & Testing Requirements
- Complete feature parity with pre-port AVFlowView.
- Visual regression: supply screenshots/snapshots for major components and edge cases.
- Every new/ported function, especially layout, transforms, edge/port/area rendering, must be unit tested.
- Benchmark render time for 100, 500, 1000 node graphs. Render time must stay below agreed thresholds (see baseline in recent `IMPLEMENTATION_STATUS.md`).
- Provide detailed error messages and validation feedback for all user. Must block rendering on schema or data errors.

## 7. Supplementary Documentation Index
- AI_AGENT_INSTRUCTIONS.md – Deep dive on feature, data flow, and core architecture
- BIDIRECTIONAL_PORTS_REFERENCE.md – Port placement pipeline and side resolution details
- IMPLEMENTATION_STATUS.md – What's implemented, config and styling particulars
- SMART_EDGE_ROUTING.md – Pathfinding and collision avoidance strategies
- STYLING_IMPLEMENTATION.md – Exact color details and layout conventions
- SESSION_SUMMARY.md – AI+dev session technical findings
- context.md – Project and use case context
- All sample/test graphs – To be referenced directly for edge case coverage

## 8. Agent Execution Protocol
- Follow each section **in order**.
- Reference code snippets/pseudocode as models for critical functions.
- Cross-check your work against behavioral expectations in the Acceptance Criteria/Migration & Testing sections.
- Never proceed past a task until strict validation (types, tests, schema, config, visual) passes.
- Document all deviations from current implementation and state rationale clearly at the top of this file and in commit messages.

---

**Update note:** As of 2025-11-15, this file merges key implementation instructions from all current deep technical docs, code, workflow, and algorithmic sources. It supersedes all previous D3 migration guides for AVFlowView.

---

_Reference: for extended in-file embedded schema, code, and exact config examples, see appendices below (add as needed)._
