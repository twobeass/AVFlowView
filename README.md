# AVFlowView

**JSON-driven viewer for A/V wiring schemas with auto-layout, category coloring, and focus/context visualization. Built with React Flow and ELK.js.**

## Features

- 🔄 **Auto-Layout**: Hierarchical graph layout using ELK.js with Sugiyama-based layering
- 🎨 **Category Coloring**: Visual distinction for device types and cable categories
- 🔍 **Focus/Context**: Interactive highlighting with configurable depth k
- 📦 **Areas**: Logical grouping (rooms, racks, zones) as compound nodes
- ✅ **Schema Validation**: Full JSON Schema validation using Ajv
- 🎯 **Port Management**: Local port keys per device with alignment control

## Tech Stack

- **React 18** + **TypeScript**
- **@xyflow/react** (React Flow) for node-based UI
- **ELK.js** for automatic graph layout
- **Ajv** for JSON Schema validation
- **Vite** for fast development

## Quick Start

### Installation

```bash
git clone https://github.com/twobeass/AVFlowView.git
cd AVFlowView
git checkout setup-mvp-structure
npm install
```

### Development

```bash
npm run dev
```

The app will open at `http://localhost:3000` with a sample A/V wiring graph.

### Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── schemas/
│   └── av-wiring-graph.schema.json  # JSON Schema for graph validation
├── components/
│   └── AVWiringViewer.tsx           # Main viewer component
├── lib/
│   ├── validator.ts                  # Ajv-based validation
│   └── elkMapper.ts                  # ELK layout transformation
├── data/
│   └── sampleGraph.json             # Example graph data
└── main.tsx                          # Application entry point
```

## JSON Schema

The graph data follows a strict JSON Schema (Draft 2020-12) with:

- **Nodes**: Devices with manufacturer, model, category, status, and local port definitions
- **Edges**: Cables connecting nodes with optional port bindings
- **Areas**: Port-less containers for logical grouping (rooms, racks)
- **Layout**: Configuration for direction (LR/TB), port binding strategy, area-first layout

See `src/schemas/av-wiring-graph.schema.json` for full specification.

## Example Data

```json
{
  "layout": { "direction": "LR", "portBinding": "auto" },
  "areas": [
    { "id": "rack1", "label": "Rack 1" }
  ],
  "nodes": [
    {
      "id": "dev1",
      "manufacturer": "ACME",
      "model": "MX-32",
      "category": "Video",
      "status": "Existing",
      "label": "Matrix",
      "areaId": "rack1",
      "ports": {
        "out1": { "alignment": "Out", "label": "SDI OUT 1", "type": "SDI", "gender": "N/A" }
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "dev1",
      "target": "dev2",
      "cableType": "SDI"
    }
  ]
}
```

## Documentation

For detailed information about the project:

- **[`.github/copilot-instructions.md`](.github/copilot-instructions.md)** - Architecture and guidance for AI coding agents
- **[`context.md`](context.md)** - Project overview and current status
- **[`DOCUMENTATION_INDEX.md`](DOCUMENTATION_INDEX.md)** - Complete documentation index
- **[`IMPLEMENTATION_STATUS.md`](IMPLEMENTATION_STATUS.md)** - Detailed implementation reference
- **[`SESSION_SUMMARY.md`](SESSION_SUMMARY.md)** - Session accomplishments and technical highlights
- **[`BIDIRECTIONAL_PORTS_REFERENCE.md`](BIDIRECTIONAL_PORTS_REFERENCE.md)** - Technical deep-dive on bidirectional port placement

## Recent Accomplishments (2025-11-13)

✅ **Bidirectional Port Placement**: Automatically positions ports based on edge direction and neighbor geometry  
✅ **AI Guidance Documentation**: Comprehensive instructions for AI coding agents  
✅ **Clean Implementation**: 4-phase pipeline (computation → mapping → propagation → rendering)  
✅ **Edge-Direction Aware**: SOURCE ports face targets, TARGET ports face sources  
✅ **Layout-Constrained**: LR layouts only use EAST/WEST, TB layouts only use NORTH/SOUTH

## Roadmap

- [ ] **Phase 1**: Basic rendering + validation ✅
- [ ] **Phase 2**: ELK layout integration ✅
- [ ] **Phase 3**: Custom node/edge styling with category colors
- [ ] **Phase 4**: Focus mode with k-depth neighborhood highlighting
- [ ] **Phase 5**: Interactive controls (zoom, pan, search, filter)
- [ ] **Phase 6**: Export functionality (PNG, SVG, PDF)

## Contributing

Contributions are welcome! This project is designed to be extended by AI agents with clear structure and comprehensive context.

## License

MIT