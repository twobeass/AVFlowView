<!--
Guidance for AI coding agents working in AVFlowView.
Keep this concise and actionable — point to concrete files, commands and patterns.
-->
# AVFlowView — Copilot Instructions

Purpose: Help AI coding agents be immediately productive in this repository by
calling out the architecture, key workflows, and project-specific conventions.

- **Start commands**
  - Install deps: `npm install`
  - Dev server: `npm run dev` (Vite opens `http://localhost:3000`)
  - Build/typecheck: `npm run build` (runs `tsc` for type-checking, then `vite build`)
  - Preview production build: `npm run preview`

- **Where to look first (big picture)**
  - Entry point: `src/main.tsx` — mounts `AVWiringViewer` with `data/sampleGraph.json`.
  - Main UI: `src/components/AVWiringViewer.tsx` — orchestrates validation, ELK layout,
    and React Flow rendering. This file shows the project dataflow: validate -> layout -> render.
  - Layout transform: `src/lib/elkMapper.ts` — builds ELK graph, runs `elk.layout`,
    post-processes port sides and returns a layout used by the viewer.
  - Validation: `src/lib/validator.ts` — Ajv (Draft 2020) against `src/schemas/av-wiring-graph.schema.json`.

- **Key data model and conventions**
  - Graph model: See `src/schemas/av-wiring-graph.schema.json`.
    - `nodes` (devices) and `edges` (cables) are required.
    - `areas` are port-less containers (rooms/racks) and may be nested via `parentId`.
    - Node IDs and port keys follow the pattern `^[A-Za-z0-9._:-]+$`.
  - Port ids in ELK: `elkMapper.createElkNode` assigns ports with id `${node.id}.${portKey}`.
  - **Bidirectional ports** (RESOLVED): 
    - Initially marked with `side: "BI_<portKey>"` in ELK during graph creation
    - `getPortSideDynamic()` resolves bidirectional ports post-layout using edge direction + neighbor geometry
    - For SOURCE ports: if target node is to the right (dx > 0), port faces RIGHT (EAST); if left (dx < 0), faces LEFT (WEST)
    - For TARGET ports: if source node is to the right (dx > 0), port faces LEFT (WEST) to face it; if left, faces RIGHT (EAST)
    - **Direction constraint**: LR layouts ONLY use EAST/WEST (never NORTH/SOUTH); TB layouts ONLY use SOUTH/NORTH
    - Resolved sides stored in `portSidesMap` and propagated to React Flow nodes via `computedSide` property
  - Edge binding: `edge.binding` can be `auto` or `exact` (from schema and `sampleGraph.json`).

- **Component patterns**
  - `AVWiringViewer` uses React Flow (`@xyflow/react`) and registers custom node types:
    - `deviceNode` -> `src/components/nodes/DeviceNode.tsx`
    - `groupNode` -> `src/components/nodes/GroupNode.tsx`
  - DeviceNode maps port `alignment` to React Flow `Handle` positions (Left/Right/...).
  - The viewer calls `layoutGraph(graphData, direction)` then converts ELK output to
    React Flow `nodes` and `edges` (see `flattenElkGroups` and `mapEdgesToReactFlow`).

- **Helpful implementation details / gotchas**
  - `package.json` `build` runs `tsc` then `vite build`. `tsc` is used for type checking only
    because `tsconfig.json` sets `noEmit: true` — do not remove `tsc` unless you replace type checks.
  - Vite config is in `vite.config.ts` (referenced by `tsconfig.node.json`), server port 3000.
  - Ajv is instantiated with `{ allErrors: true, strict: false }` — validation errors are
    surfaced as `{ path, message }` by `validateGraph`.
  - ELK configuration uses layered algorithm and explicit spacing options. Changes to layout
    parameters live in `src/lib/elkMapper.ts`.
  - **Bidirectional port resolution pipeline** (see `elkMapper.ts` `layoutGraph` function):
    1. `createElkNode()`: Marks bidirectional ports with `side: "BI_${portKey}"`
    2. `elk.layout()`: Computes node positions post-layout
    3. `collectPositions()`: Builds `nodePos` map of all node coordinates
    4. `walkAndFixPorts()`: Traverses ELK tree, replaces `BI_*` markers with resolved sides via `getPortSideDynamic()`
    5. `buildPortSidesMap()`: Extracts resolved sides into clean `portSidesMap` (nodeId → portKey → side)
    6. Attaches map as `elkLayout.__portSides` for propagation to React layer
  - **Port-to-React propagation** (see `AVWiringViewer.tsx`):
    1. `layoutGraph()` returns layout with `__portSides` map attached
    2. `flattenElkGroups()` receives `portSidesMap` and merges resolved sides into `clonedPorts[key].computedSide`
    3. React Flow nodes receive complete port objects with `computedSide` property
  - **Handle positioning** (see `DeviceNode.tsx`):
    - `elkSideToPosition()` maps ELK sides (WEST/EAST/NORTH/SOUTH) to React Flow Positions (Left/Right/Top/Bottom)
    - Render loop prefers `port.computedSide` (ELK-resolved) over `port.alignment` (fallback)

- **When writing code changes**
  - Preserve the JSON schema: the validator enforces `additionalProperties: false` in many defs.
    If you update schema shape, update `sampleGraph.json` and adjust validator expectations.
  - Keep UI logic in `AVWiringViewer` and node-specific rendering in `components/nodes/*`.
  - For layout changes, prefer editing `elkMapper.ts` rather than scattering layout logic.

- **Tests & linting**
  - There are no tests in the repo. Use `npm run lint` to run ESLint checks.
  - Type safety: project uses TypeScript `strict: true` — fix types rather than suppressing.

- **Examples (copy-paste when editing data)**
  - Node with ports (from `data/sampleGraph.json`):
    - `"ports": { "hdmi-in1": { "alignment": "In", "label": "HDMI IN 1", "type": "HDMI", "gender": "F" } }`
  - Edge binding hint:
    - `"binding": "exact"` forces `sourcePortKey`/`targetPortKey` usage.

- **Where to add new features**
  - New UI bits → `src/components/*` or `src/components/nodes/*` for node/area visuals.
  - Layout / algorithm changes → `src/lib/elkMapper.ts`.
  - New validation rules → `src/schemas/av-wiring-graph.schema.json` and `src/lib/validator.ts`.

If anything here is unclear or you want more detail in a particular area (e.g., layout options,
port-binding logic, or how React Flow is used), tell me which section to expand and I will iterate.
