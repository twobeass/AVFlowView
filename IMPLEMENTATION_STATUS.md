# AVFlowView Implementation Status

**Last Updated**: November 13, 2025  
**Status**: ✅ COMPLETE - Bidirectional Port Placement Fixed

## Completed Tasks

### 1. AI Guidance Documentation ✅
- **File**: `.github/copilot-instructions.md`
- **Status**: Created and updated with comprehensive architecture, workflows, and conventions
- **Content**: Start commands, architecture overview, data model, component patterns, implementation details, port resolution pipeline

### 2. Bidirectional Port Placement ✅
- **Problem**: Bidirectional ports were being rendered at incorrect positions (TOP/NORTH instead of appropriate sides)
- **Root Cause**: Port side resolution logic was incomplete; didn't account for edge source/target direction
- **Solution Implemented**:

#### Phase 1: Port Side Computation
- File: `src/lib/elkMapper.ts` - `getPortSideDynamic()` function
- Logic:
  - **LR Layouts (horizontal)**: Only allows EAST (Right) or WEST (Left), never NORTH/SOUTH
  - **TB Layouts (vertical)**: Only allows SOUTH (Bottom) or NORTH (Top), never EAST/WEST
  - **Edge Direction Aware**: 
    - For SOURCE ports: Calculate direction to target node
    - For TARGET ports: Calculate direction to source node (inverted for correct facing)
  - **Algorithm**: Sum dx/dy across all edges for a port, use sign to determine side
    - Positive sum → Right/Bottom for sources, Left/Top for targets
    - Negative sum → Left/Top for sources, Right/Bottom for targets

#### Phase 2: Port Sides Map
- File: `src/lib/elkMapper.ts` - `buildPortSidesMap()` and return value
- Process:
  1. After ELK layout, create clean `portSidesMap: { nodeId: { portKey: side, ... }, ... }`
  2. Traverse entire ELK tree to extract all resolved port sides
  3. Attach map to returned layout as `elkLayout.__portSides`
  4. Avoids relying on potentially mutable ELK port objects

#### Phase 3: Propagation to React
- File: `src/components/AVWiringViewer.tsx` - `flattenElkGroups()` function
- Process:
  1. Receive `portSidesMap` as parameter from `layoutGraph()` return value
  2. For each device node, read resolved sides from map
  3. Merge `computedSide` property into cloned port objects
  4. Pass complete port data (with computedSide) to React Flow node data

#### Phase 4: Handle Positioning
- File: `src/components/nodes/DeviceNode.tsx`
- Helpers:
  - `elkSideToPosition()`: Maps ELK sides (WEST/EAST/NORTH/SOUTH) → React Flow Positions (Left/Right/Top/Bottom)
- Render Logic:
  - Port render loop checks `port.computedSide` first (ELK-resolved)
  - Falls back to `portAlignmentToPosition[port.alignment]` if undefined
  - Passes resolved Position to React Flow Handle component

### Key Implementation Files

| File | Changes | Purpose |
|------|---------|---------|
| `src/lib/elkMapper.ts` | `getPortSideDynamic()`, `walkAndFixPorts()`, `buildPortSidesMap()`, `layoutGraph()` return | Port side resolution and propagation |
| `src/components/AVWiringViewer.tsx` | `flattenElkGroups(portSidesMap)`, `layoutGraph()` call | Port side propagation to React layer |
| `src/components/nodes/DeviceNode.tsx` | `elkSideToPosition()`, port render loop | Handle positioning based on computed side |
| `.github/copilot-instructions.md` | Updated data model and implementation details | AI agent guidance |

## Test Case: panel1.net Port

**Graph**: `panel1` (Control Room, source) → `mx1` (Main Hall, target)  
**Port**: `net` (Bidirectional, CAT7)  
**Edge**: `e2` with `binding: "auto"`

**Expected Result**: Handle on **LEFT (WEST)** side of panel1 node  
**Actual Result**: ✅ Handle correctly positioned on LEFT side

**Flow Trace**:
1. `createElkNode`: panel1.net marked with `side: "BI_net"`
2. `getPortSideDynamic(panel1, net, true)`:
   - Edge found: panel1 (SOURCE) → mx1 (TARGET)
   - mx1 position: 53 units to the LEFT (dx = -53)
   - isSource = true, so direction = dx = -53
   - totalDx = -53 (negative)
   - Result: WEST (Left) ✅
3. `portSidesMap`: `{ "panel1": { "net": "WEST" } }`
4. `flattenElkGroups`: Sets `panel1.net.computedSide = "WEST"`
5. `DeviceNode`: Renders with `elkSideToPosition("WEST")` → `Position.Left` ✅

## Logging & Debugging

All console logs removed for production. Key functions logged during development:
- `[getPortSideDynamic]`: Port side computation trace
- `[layoutGraph]`: Final portSidesMap dump
- `[flattenElkGroups]`: Port side propagation trace
- `[DeviceNode]`: Handle position render trace

To re-enable logging during debugging, search for `console.log` statements in:
- `elkMapper.ts` line 84-100
- `AVWiringViewer.tsx` line 63-67
- `DeviceNode.tsx` line 59

## Architecture Summary

```
Graph JSON (sampleGraph.json)
    ↓
layoutGraph(graphData, direction)
    ├→ ELK setup & layout execution
    ├→ collectPositions() → nodePos map
    ├→ walkAndFixPorts() → resolve BI_* → sides
    ├→ buildPortSidesMap() → clean map
    └→ return layout with __portSides attached
    ↓
AVWiringViewer.tsx
    ├→ receives layout + portSidesMap
    ├→ flattenElkGroups(root, graphData, parent, portSidesMap)
    │   ├→ for each device: merge computedSide from map
    │   └→ return React Flow nodes with complete port data
    └→ ReactFlow renders nodes
        ↓
DeviceNode.tsx
    ├→ for each port: read computedSide
    ├→ elkSideToPosition(computedSide) → Position
    └→ render Handle at correct position
```

## Future Enhancements

- Consider caching port side computations if layoutGraph is called frequently
- Add port-binding strength hints (e.g., prefer specific sides for certain port types)
- Extend to support more complex port arrangement strategies (clustered, distributed, etc.)
- Add unit tests for `getPortSideDynamic()` with various graph topologies

## Known Limitations

- Bidirectional ports **must** be connected by edges with `sourcePortKey`/`targetPortKey` for side resolution
- Ports with no connected edges fall back to default (EAST for LR, SOUTH for TB)
- Direction constraint enforced strictly: LR layouts cannot use NORTH/SOUTH, TB layouts cannot use EAST/WEST
