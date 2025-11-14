# Edge Routing in AVFlowView

This document describes the edge routing approach in AVFlowView and the available routing options.

## Current Implementation: Smoothstep Edges

**AVFlowView currently uses ReactFlow's built-in `smoothstep` edge type**, which provides:
- **Step-like routing** - Clean horizontal/vertical segments with smooth transitions
- **Rounded corners** - Professional-looking curved transitions
- **Reliable performance** - Optimized built-in ReactFlow rendering
- **Perfect for ELK** - Works harmoniously with ELK's layout optimization

### Why Smoothstep?

ELK.js already optimizes node positions to minimize edge crossings and overlaps. The `smoothstep` edge type:
- Complements ELK's layout decisions
- Provides clean visual presentation
- Requires no complex configuration
- Performs excellently with hierarchical layouts

## Alternative: Custom A* Pathfinding (Available but Not Active)

A complete A* pathfinding implementation is available in `src/lib/edgeRouting/` for future use cases:
- **Avoid node collisions** - Edges route around nodes rather than overlapping them
- **Use rounded corners** - Smooth, professional-looking edge paths  
- **Follow Manhattan routing** - Horizontal and vertical segments with right-angle turns
- **Minimize path length** - A* algorithm finds the shortest collision-free path

## Architecture

### Directory Structure

```
src/lib/edgeRouting/
├── index.ts                 # Main entry point & orchestrator
├── types.ts                 # TypeScript interfaces
├── algorithms/
│   ├── aStar.ts            # A* pathfinding implementation
│   └── simple.ts           # Simple direct path fallback
└── geometry/
    ├── point.ts            # Point manipulation utilities
    ├── edge.ts             # Line direction utilities
    └── path.ts             # SVG path generation
```

### Components

- **SmartEdge** (`src/components/edges/SmartEdge.tsx`) - ReactFlow custom edge component
- Uses `useInternalNode` hook to access node positions and dimensions
- Calculates routing dynamically based on node layout

## Algorithm

The routing algorithm works in several steps:

1. **Offset Calculation** - Calculate points offset from node handles by a configurable distance
2. **Proximity Check** - Determine if nodes are close enough for simple direct routing
3. **Vertex Generation** - Create potential routing points around node rectangles
4. **A* Pathfinding** - Find optimal path through routing points avoiding obstacles
5. **Point Reduction** - Remove redundant points on straight line segments
6. **Corner Rounding** - Generate smooth SVG path with rounded corners

## Configuration

Default configuration in `src/lib/edgeRouting/types.ts`:

```typescript
{
  enabled: true,
  offset: 20,              // Minimum distance from nodes (px)
  cornerRadius: 8,         // Rounded corner radius (px)
  simplifyThreshold: 2,    // Point reduction threshold
}
```

## Usage

### Switching Between Edge Types

To use custom A* routing instead of smoothstep, change the edge type in `AVWiringViewer.tsx`:

```typescript
// Current: Smoothstep (recommended for ELK layouts)
type: 'smoothstep',

// Alternative: Custom A* routing
type: 'smart', // Uses SmartEdge component from src/components/edges/SmartEdge.tsx
```

**Recommendation**: Keep `smoothstep` for ELK-based layouts. Only switch to `smart` if using manual node positioning.

### Fallback Behavior

SmartEdge gracefully falls back to simple straight lines when:
- Source or target nodes are not found
- Nodes haven't been measured yet (initial render)
- An error occurs during path calculation

## Benefits

✅ **Professional Appearance** - Clean, rounded edges that look polished
✅ **Better Readability** - Edges don't overlap nodes, making connections clearer
✅ **Optimal Routing** - A* finds shortest paths efficiently
✅ **Maintained Features** - All existing features work (colors, labels, ports, focus mode)

## Future Extensibility

The modular architecture supports easy addition of alternative layout algorithms:

```
src/lib/layout/
├── index.ts                # Layout manager
├── algorithms/
│   ├── elk.ts             # Current ELK implementation
│   ├── dagre.ts           # Future: Dagre algorithm
│   └── d3.ts              # Future: D3-hierarchy algorithm
└── types.ts               # Common layout interfaces
```

## Performance

- **A* Pathfinding** - O(n log n) complexity, efficient for typical graph sizes
- **Memoization** - Edge paths recalculated only when node positions change
- **Lazy Evaluation** - Paths calculated on-demand per edge

## Troubleshooting

### Edges showing as straight lines

Check browser console for warnings:
- `"Nodes not found"` - Edge references invalid node IDs
- `"Nodes not measured yet"` - ReactFlow still measuring nodes (temporary during initial render)

### Edges overlapping nodes

- Increase `offset` parameter in edge routing config
- Check that node dimensions are accurately reported

### Performance issues

- Reduce number of visible edges using focus mode
- Consider disabling smart routing for very large graphs (100+ nodes)

## References

- [A* Search Algorithm](https://en.wikipedia.org/wiki/A*_search_algorithm)
- [Manhattan Distance](https://simple.wikipedia.org/wiki/Manhattan_distance)
- [ReactFlow Custom Edges](https://reactflow.dev/learn/customization/custom-edges)
- [Inspiration: reactflow-auto-layout](https://github.com/idootop/reactflow-auto-layout)
