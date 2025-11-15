# AVFlowView-D3: Autonomous Coding Agent Guide

This specification describes the complete roadmap and requirements for an autonomous coding agent to reimplement AVFlowView as a D3.js-based schematic visualizer, leveraging the d3-hwschematic library and ELK.js for advanced graph layout, edge separation, and automated rendering. All existing AVFlowView features must be fully migrated and the codebase restructured for maximum maintainability, extensibility, and performance. All config-driven, interactive, and schema aspects require explicit coverage.

## Objectives
- Migrate the existing AVFlowView React Flow implementation to D3.js and d3-hwschematic.
- Preserve and enhance core functionalities: auto-layout, smart orthogonal edge routing, bidirectional port placement, category/area coloring, focus/context management, JSON validation, interactive controls, and extensible configuration.
- Deliver full documentation, typed interfaces, and modular architecture.

## Project Structure
```
avflow-d3/
├── src/
│   ├── adapters/         # AV JSON → ELK JSON conversion
│   ├── core/             # Schematic renderer, layout, focus logic
│   ├── config/           # Centralized color, layout, style config
│   ├── data/             # Sample graphs, testcases
│   ├── features/         # Focus/context, selection, export
│   ├── renderers/        # Custom node, edge, area renderer
│   ├── schemas/          # JSON schema definition
│   └── types/            # TS interfaces
├── README.md
├── avflow-d3.md          # **This agent guide**
└── package.json
```

## 1. Data Model & JSON Schema
- Port and adapt current AV wiring graph JSON schema (`src/schemas/av-wiring-graph.schema.json`).
- Describe nodes (devices), ports, areas, edges, and layout configs; draw from current implementation.
- The schema must support:
  - Categories, status, manufacturer, labels, area grouping
  - Port types, labels, alignments, and computed positions
  - Edge attributes: cable types, port bindings
  - Areas/zones/racks
  - Layout parameters (direction, port binding mode, area-first layout)
- Validate every loaded graph against the schema using Ajv. Provide type definitions for safer coding.

## 2. Centralized Configs
- Color configuration in `src/config/colors.ts`:
  - Define device, edge, area, and port colors per category (audio, video, control, network, power)
  - Type-safe, single source of truth
- Layout and styling configuration in `src/config/elkConfig.ts`:
  - All ELK options for orthogonal routing, edge separation, node and edge spacing, crossing minimization, port constraints, etc.
- Enable easy, runtime-configurable updates.

## 3. AV JSON → ELK JSON Adapter
- Write adapter in `src/adapters/avToElkAdapter.ts`:
  - Convert AV graph JSON into ELK.js hierarchical structure with correct areas/groups, nodes, ports, and edges
  - Attach all necessary hwMeta properties to nodes, ports, and edges for d3-hwschematic compatibility
  - Handle area containment, grouping logic, collapsed (`_children`) states for larger graphs
  - Index and reference ports/nodes consistently
  - Provide thorough unit tests using graphs with edge, port, and area complexity

## 4. Schematic Renderer Core
- Build main entry point in `src/core/AVSchematicRenderer.ts`:
  - Accept validated AV graph
  - Call AV→ELK adapter
  - Perform layout using ELK.js Layered + Orthogonal routing
  - Pass result to d3-hwschematic for rendering
  - Register custom node, edge, and area renderers
  - Provide hooks for runtime config changes
  - Update DOM/SVG in response to graph or config changes

## 5. Node, Port, Edge Rendering Logic
- Write classes for device nodes, area/group nodes, and edges in `src/renderers/`.
- Device nodes:
  - Side-by-side port layout (inputs left, outputs right, bidirectional dynamic)
  - Category and status-colorized backgrounds
  - Labels, manufacturer, model, status
  - Expand/collapse controls for hierarchical structures
- Ports:
  - Precise positioning and alignment per computed ELK side
  - Allow hover, selection, and tooltips
- Edges:
  - Use ELK-provided bend points for exact orthogonal paths
  - Rounded corners, color per category, tooltips
  - Fully support bidirectional and hyper-edges

## 6. Focus/Context Features
- Implement focus/context highlight logic in `src/features/focusMode.ts`:
  - Select node and highlight k-depth subgraph (BFS traversal)
  - Dim unrelated nodes and edges visually
  - Allow configuration of focus depth and styles
  - Support interaction via click, keyboard, and programmatic triggers

## 7. Interactivity & Controls
- Loader for AV JSON files (local and remote)
- Zoom, pan, and fit-to-screen controls using d3-zoom
- Node/port/edge selection with visual highlight and tooltip
- Expand/collapse for hierarchical nodes and areas
- Filter by category/status/area

## 8. Export & Utility Functions
- Enable export of the current view as PNG, SVG, PDF
- Allow graph data export/import including current layout state

## 9. Testing & Validation
- Rigorous unit and integration tests for all converters, renderers, and focus logic
- Visual regression tests for main feature and edge cases
- Ensure robust validation of all loaded AV JSONs versus the schema
- Provide test coverage summary

## 10. Documentation & Extensibility
- Document all modules, classes, and extensibility points in code and README
- Ensure that `avflow-d3.md` describes:
  - All architectural decisions
  - The implementation pipeline from JSON load to SVG output
  - Extensible renderer registration system
  - Expected input/output for every module
  - Error handling and logging guidelines
- Provide a migration FAQ for code agents

## Implementation Pipeline
1. Validate AV wiring graph JSON
2. Adapt graph to ELK JSON using AV→ELK adapter
3. Layout graph with ELK (Layered + Orthogonal, with edge separation)
4. Render with d3-hwschematic
5. Apply custom node, edge, and area renderers via registration
6. Load color/config from centralized config
7. Attach focus/context handlers
8. Enable interactivity (zoom, select, expand/collapse)
9. Export/Import functions
10. Document every step/code path

## References
- [d3-hwschematic Documentation](https://github.com/Nic30/d3-hwschematic)
- [ELK.js Documentation](https://www.eclipse.org/elk/documentation.html)
- [D3.js Documentation](https://github.com/d3/d3/wiki)
- [Ajv JSON Schema Validator](https://ajv.js.org/)

---

**AWESOME AGENT CHALLENGE**
> Implement this entire specification autonomously, maximizing code re-use, reliability, and extensibility. Keep all config logic, feature parity, and documentation on par or improved compared to the original AVFlowView. All architectural, type, and API choices must be peer-review ready and CI testable. Always adhere to TypeScript strictness and provide migration/implementation notes where relevant.

**File: avflow-d3.md**
This file serves as the canonical implementation guide and should be kept current throughout agent-driven development.