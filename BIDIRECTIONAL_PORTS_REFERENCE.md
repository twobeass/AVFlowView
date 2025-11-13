# Bidirectional Port Placement - Technical Reference

**Status**: ✅ Fully Implemented and Rendering Fixed  
**Date**: November 13, 2025  
**Latest Update**: November 13, 2025 - Fixed rendering and alignment

## Overview

Bidirectional ports (ports without a fixed input/output direction) automatically position themselves based on their connected edges and the relative positions of connected nodes. This ensures that ports always face toward their connection partners, improving diagram clarity.

## Recent Fixes (November 13, 2025)

### Critical Bug Fix: Bidirectional Ports Not Rendering
**Problem**: Bidirectional ports only had source handles, preventing incoming connections from rendering  
**Solution**: Added BOTH source AND target handles at same position for each bidirectional port  
**Result**: All bidirectional connections (Dante, Ethernet, Fiber) now render correctly

### Vertical Alignment Fix
**Problem**: Bidirectional ports rendered in separate section, misaligned with other ports  
**Solution**: Integrated bidirectional ports into main two-column layout grid based on computed side  
**Result**: Perfect vertical alignment with input/output ports

## Implementation Details

### Phase 1: Port Side Computation

**Location**: `src/lib/elkMapper.ts` - `getPortSideDynamic(nodeId, portKey, isHorizontal)`

#### Algorithm

```typescript
function getPortSideDynamic(nodeId, portKey, isHorizontal) {
  // 1. Find all edges connected to this port
  const edgesForPort = graphData.edges.filter(e =>
    (e.source === nodeId && e.sourcePortKey === portKey) ||
    (e.target === nodeId && e.targetPortKey === portKey)
  );
  
  // 2. Get node position
  const node = nodePos[nodeId];
  
  // 3. For each edge, calculate direction accounting for edge type
  let totalDx = 0;
  edgesForPort.forEach(edge => {
    const isSource = edge.source === nodeId;
    const otherId = isSource ? edge.target : edge.source;
    const other = nodePos[otherId];
    
    const dx = other.x - node.x;
    // KEY INSIGHT:
    // - For SOURCE edges: positive dx means target is right → port faces right
    // - For TARGET edges: positive dx means source is right → port faces LEFT to face it
    const direction = isSource ? dx : -dx;
    totalDx += direction;
  });
  
  // 4. Determine side based on sum
  return totalDx > 0 ? 'EAST' : 'WEST';  // (for LR layout)
}
```

#### Key Points

1. **Edge-Direction Aware**: 
   - SOURCE ports sum `dx` as-is (positive dx = target right → face right)
   - TARGET ports sum `-dx` (positive dx = source right → face left toward source)

2. **Layout Orientation**:
   - **LR (Left-Right)**: Only outputs EAST/WEST
   - **TB (Top-Bottom)**: Only outputs NORTH/SOUTH

3. **Multi-Edge Handling**: Sums all neighbor positions to get average direction

4. **Fallback**: Returns EAST (LR) or SOUTH (TB) if no edges found

#### Examples

**Example 1: panel1.net → mx1 (source edge)**
```
panel1 position: x=200
mx1 position: x=147

dx = 147 - 200 = -53 (mx1 is LEFT)
isSource = true
direction = dx = -53
Result: totalDx < 0 → WEST ✅
```

**Example 2: mx1.hdmi-in2 ← panel1 (target edge)**
```
mx1 position: x=147
panel1 position: x=200

dx = 200 - 147 = 53 (panel1 is RIGHT)
isSource = false
direction = -dx = -53
Result: totalDx < 0 → WEST ✅ (mx1 faces toward panel1)
```

### Phase 2: Port Sides Map

**Location**: `src/lib/elkMapper.ts` - `buildPortSidesMap()` and return statement

#### Purpose

Create a clean mapping of resolved port sides, separate from ELK's internal objects.

#### Structure

```typescript
const portSidesMap = {
  "nodeId1": {
    "portKey1": "WEST",
    "portKey2": "EAST",
    ...
  },
  "nodeId2": {
    "portKey1": "NORTH",
    ...
  },
  ...
};
```

#### Building Process

```typescript
function buildPortSidesMap(elkNode) {
  if (!elkNode.ports) return;
  
  portSidesMap[elkNode.id] = {};
  elkNode.ports.forEach(port => {
    const portKey = port.properties.portKey;
    const side = port.properties.side;
    portSidesMap[elkNode.id][portKey] = side;
  });
  
  // Recurse into children
  if (elkNode.children) {
    elkNode.children.forEach(child => buildPortSidesMap(child));
  }
}

// Store in layout
(elkLayout as any).__portSides = portSidesMap;
```

#### Why Separate?

1. **Immutability**: ELK objects might be immutable or have side effects
2. **Clarity**: Clean data structure for React consumption
3. **Debuggability**: Easy to inspect and verify port side assignments
4. **Separation of Concerns**: Layout computation separate from rendering

### Phase 3: Propagation to React

**Location**: `src/components/AVWiringViewer.tsx` - `flattenElkGroups()`

#### Process

```typescript
function flattenElkGroups(elkNode, graphData, parent, portSidesMap) {
  // For device nodes:
  const d = graphData.nodes.find(n => n.id === elkNode.id);
  
  // Clone ports and merge computedSide
  const clonedPorts = {};
  Object.entries(d.ports).forEach(([k, p]) => {
    clonedPorts[k] = { ...p };
  });
  
  // Add computed sides from map
  const nodeSides = portSidesMap[elkNode.id] || {};
  Object.entries(nodeSides).forEach(([portKey, side]) => {
    if (clonedPorts[portKey]) {
      clonedPorts[portKey].computedSide = side;  // KEY: Add computed side
    }
  });
  
  // Create React Flow node with ports including computedSide
  const dataWithPorts = { ...d, ports: clonedPorts };
  nodes.push({
    id: elkNode.id,
    type: 'deviceNode',
    data: dataWithPorts,  // Includes ports with computedSide
    ...
  });
  
  // Recurse
  if (elkNode.children) {
    elkNode.children.forEach(child => {
      nodes.push(...flattenElkGroups(child, graphData, elkNode.id, portSidesMap));
    });
  }
}
```

#### Key Integration

- `layoutGraph()` returns: `{ children, edges, __portSides }`
- `AVWiringViewer` extracts: `const portSidesMap = layouted.__portSides`
- Passes to: `flattenElkGroups(root, graphData, null, portSidesMap)`
- Result: React Flow nodes with `data.ports[key].computedSide` populated

### Phase 4: Handle Positioning

**Location**: `src/components/nodes/DeviceNode.tsx`

#### Side-to-Position Mapping

```typescript
function elkSideToPosition(side) {
  switch (side) {
    case 'WEST': return Position.Left;
    case 'EAST': return Position.Right;
    case 'NORTH': return Position.Top;
    case 'SOUTH': return Position.Bottom;
    default: return undefined;
  }
}
```

#### Port Rendering

```typescript
ports.map(([key, port]) => {
  // Priority 1: ELK-computed side
  const elkPos = elkSideToPosition(port.computedSide || undefined);
  
  // Priority 2: Fallback to alignment
  const position = elkPos || 
                   portAlignmentToPosition[port.alignment] || 
                   Position.Right;
  
  return (
    <div key={key}>
      {port.label}
      <Handle
        type={port.alignment === "In" ? "target" : "source"}
        id={key}
        position={position}  // KEY: Use computed position
        ...
      />
    </div>
  );
});
```

#### Port Type Mapping

- `"In"` alignment → Handle type = `"target"` (input port)
- `"Out"` alignment → Handle type = `"source"` (output port)
- `"Bidirectional"` alignment → Handle type = `"source"` (can be either, defaults to output)

## Testing

### Test Case: panel1.net

**Graph Setup**:
```json
{
  "source": "panel1",
  "sourcePortKey": "net",
  "target": "mx1",
  "targetPortKey": "hdmi-in2"
}
```

**Port Definition**:
```json
{
  "id": "panel1",
  "ports": {
    "net": {
      "alignment": "Bidirectional",
      "label": "LAN",
      "type": "CAT7"
    }
  }
}
```

**Layout**:
- panel1 in roomB (x=200)
- mx1 in rackA/roomA (x=147)
- mx1 is 53 units to the LEFT

**Computation**:
```
getPortSideDynamic("panel1", "net", true):
  - Edge: panel1 (SOURCE) → mx1
  - dx = 147 - 200 = -53
  - isSource = true
  - direction = -53
  - totalDx = -53
  - Result: WEST ✅
```

**Expected Result**: Handle on LEFT (WEST) side of panel1 node  
**Actual Result**: ✅ VERIFIED

## Design Decisions

### Why Not Just Use Proximity?

❌ **Initial approach**: Sum distances to all nodes  
**Problem**: Doesn't consider edge direction, could misplace SOURCE/TARGET

✅ **Current approach**: Sum distances considering edge direction  
**Benefit**: SOURCE/TARGET ports face correct directions

### Why Separate Map?

❌ **Alternative**: Mutate ELK port properties  
**Problems**:
- ELK objects might be immutable
- Harder to debug
- Unclear data flow

✅ **Current approach**: Build separate portSidesMap  
**Benefits**:
- Clean data structure
- Easy inspection
- Clear separation of concerns

### Why Enforce Layout Constraints?

❌ **Alternative**: Allow all 4 sides  
**Problem**: Bidirectional ports could appear on physically impossible sides in certain layouts

✅ **Current approach**: LR only EAST/WEST, TB only NORTH/SOUTH  
**Benefit**: Ensures geometric consistency with layout algorithm

## Edge Cases & Fallbacks

| Case | Behavior |
|------|----------|
| No edges connected | Return default (EAST for LR, SOUTH for TB) |
| Multiple edges | Sum all directions, use aggregate sign |
| Mixed source/target | Properly invert target edge directions |
| Nested nodes | Recursively built into map, no special handling needed |
| No computedSide in render | Fall back to alignment value |

## Performance Considerations

- **One-time computation**: Port sides resolved once per layout
- **O(n) complexity**: Each port examined once per connected edge
- **Map building**: O(n) tree traversal
- **React propagation**: O(n) port iteration per node

No caching needed for typical graphs; consider if doing real-time layout updates.

## Future Enhancements

1. **Port Binding Strength**: Prefer certain sides for certain port types
2. **Clustering**: Group bidirectional ports together on same side
3. **Port Rotation**: Advanced port arrangement strategies
4. **Custom Strategies**: Allow user-defined port placement algorithms
5. **Unit Tests**: Formalized test suite for `getPortSideDynamic()`

## Debugging Tips

**To re-enable logging**:
1. Uncomment `console.log()` calls in:
   - `elkMapper.ts` line 84-100 (getPortSideDynamic)
   - `AVWiringViewer.tsx` line 63-67 (flattenElkGroups)
   - `DeviceNode.tsx` line 59 (render loop)

2. Rebuild and check browser console (F12)

**Key logs to look for**:
- `[getPortSideDynamic]`: Port side calculation trace
- `[flattenElkGroups]`: Port side propagation trace
- `[DeviceNode]`: Final rendered position confirmation
