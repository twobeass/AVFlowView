# Edge Separation Investigation & Findings

**Date**: November 14, 2025  
**Objective**: Implement edge-to-edge separation to prevent parallel edges from overlapping

## Problem Statement

When multiple edges follow similar paths in the graph (especially vertically in LR layouts), they visually overlap making it difficult to distinguish individual connections. The goal was to achieve separation similar to port spacing (~16px) between neighboring edges.

## Key Findings

### ✅ What Works

1. **Port-based Horizontal Spacing**
   - Naturally achieved through different port positions on nodes
   - Edges connecting to different ports automatically have horizontal separation
   - No additional work needed

2. **ELK Spacing Configuration** (Partial)
   - Setting `elk.layered.spacing.edgeEdgeBetweenLayers: '16'` 
   - Setting `elk.spacing.edgeEdge: '16'`
   - **Effect**: Influences node placement to make room for edges
   - **Limitation**: Doesn't control actual edge rendering/paths

### ❌ What Doesn't Work (Attempted Approaches)

## Approach 1: ELK Orthogonal Routing with Custom Edge Component

### What Was Tried
```typescript
// In elkMapper.ts
'elk.edgeRouting': 'ORTHOGONAL'

// Created ElkEdge.tsx to render ELK's routing sections
// Used edge.sections[0].bendPoints from ELK
```

### Why It Failed
1. **Coordinate System Mismatch**
   - ELK provides absolute coordinates in layout space
   - ReactFlow needs edges to connect to actual handle positions (dynamic)
   - Attempted fix: Start at ReactFlow's sourceX/Y, use ELK bend points, end at targetX/Y
   
2. **Connection Issues**
   - Edges didn't properly snap to node handles
   - Visual disconnect between edge start/end and ports
   - Complex to debug and maintain

3. **Complexity**
   - Required custom edge component understanding both ELK and ReactFlow coordinate systems
   - Fragile - breaks when either system changes

### Code Artifacts
- `src/components/edges/ElkEdge.tsx` - Custom edge component (not in use)

---

## Approach 2: Offset-Based Smoothstep Edges

### What Was Tried
```typescript
// Group parallel edges by source-target-port combination
const key = `${source}:${sourcePort}-${target}:${targetPort}`;

// Calculate perpendicular offset for each edge in group
offset = (index - (totalEdges - 1) / 2) * 16; // 16px spacing

// Apply offset in custom smoothstep wrapper
if (isHorizontal) {
  adjustedSourceY += offset;  // Vertical offset for horizontal edges
  adjustedTargetY += offset;
}
```

### Why It Failed
1. **ReactFlow Handle Errors**
   - Console showed: `"Couldn't create edge for source handle id"`
   - Port handle ID mapping issues
   - Some edges weren't rendering at all

2. **Grouping Limitations**
   - Only groups edges with identical source/target ports
   - Many visually parallel edges connect different ports (different grouping key)
   - Limited effectiveness - most edges aren't truly "parallel" by this definition

3. **Visual Artifacts**
   - Offset edges didn't properly connect to handles
   - Looked disconnected or floating

### Code Artifacts
- `src/components/edges/OffsetSmoothStepEdge.tsx` - Offset wrapper (not in use)
- Grouping logic in `mapEdgesToReactFlow()` (reverted)

---

## Approach 3: Standard Smoothstep with Increased Node Spacing

### What Was Tried
```typescript
// Significantly increase node spacing to give edges more room
'elk.spacing.nodeNode': '300',  // Up from 200
'elk.layered.spacing.nodeNodeBetweenLayers': '400',  // Up from 250
```

### Why It Was Not Pursued
- Would spread graph too much
- Reduces information density
- Doesn't solve the core problem (edges still overlap)
- Just makes overlaps less frequent

---

## Core Technical Limitations

### React Flow Built-in Edge Types
React Flow's `smoothstep`, `bezier`, and `straight` edge types:
- ✅ Draw curves directly between source and target points
- ❌ Have NO built-in edge-to-edge collision avoidance
- ❌ Don't maintain minimum distance from other edges
- ❌ Don't support perpendicular offsets well

### The Fundamental Challenge
To achieve true edge separation, you need:

1. **Global Path Calculation**
   - Know positions of ALL edges before rendering any
   - Calculate separation considering all parallel paths
   - Adjust paths dynamically to avoid conflicts

2. **Orthogonal Routing System**
   - Manhattan-style (only horizontal/vertical segments)
   - Explicit bend points that can be offset
   - Coordinate system that respects both layout and rendering

3. **Edge Bundling Algorithm**
   - Group related edges
   - Calculate bundle paths with proper spacing
   - Distribute edges within bundles

**React Flow doesn't provide these out of the box.**

---

## What Partially Worked

### ELK Edge Spacing Configuration (Current State)
```typescript
// elkMapper.ts
'elk.layered.spacing.edgeEdgeBetweenLayers': '16',
'elk.spacing.edgeEdge': '16',
```

**Benefits:**
- Tells ELK to reserve space between edges during node layout
- Nodes positioned with more room for edge routing
- Some natural edge separation as a side effect

**Limitations:**
- Only affects node placement, not edge rendering
- Smoothstep edges still draw direct curves (ignore spacing)
- Limited impact on visual overlap

---

## Alternative Solutions (Not Implemented)

### Option 1: Different Visualization Library
**Libraries with Better Edge Routing:**
- **Cytoscape.js** - Native edge bundling, better collision avoidance
- **D3.js with d3-hierarchical** - Full control over edge paths
- **Vis.js Network** - Built-in edge smoothing with separation
- **GoJS** - Commercial, excellent orthogonal routing

**Pros:** Built-in edge separation  
**Cons:** Would require rewriting entire visualization

### Option 2: Custom Orthogonal Router
Implement a complete orthogonal edge routing system:
1. Calculate initial straight-line paths
2. Detect edge-edge collisions
3. Insert bend points to create separation
4. Render with custom edge component

**Pros:** Full control, tailored to needs  
**Cons:** Significant engineering effort (weeks), complex maintenance

### Option 3: Edge Bundling Post-Process
Group edges by similarity, calculate bundle paths:
1. Group edges by rough direction
2. Calculate bundle centerline
3. Distribute edges around centerline with spacing
4. Use custom edge component to render

**Pros:** Can work with React Flow  
**Cons:** Complex algorithm, coordinate system challenges

### Option 4: Accept Current Behavior
**Recognize that:**
- Edge overlap is common in dense graphs
- Most graph visualizations have this issue
- Focus mode reduces edge density
- Users can zoom in for clarity

**Pros:** No additional work  
**Cons:** Visual clutter in dense regions

---

## Recommendations

### Short Term (Current State)
✅ Keep standard `smoothstep` edges  
✅ Keep ELK edge spacing configuration (helps slightly)  
✅ Rely on port positioning for horizontal separation  
✅ Use focus mode to reduce visual complexity

### Medium Term (If Edge Separation Becomes Critical)
1. **Evaluate Alternative Libraries**
   - Prototype with Cytoscape.js or similar
   - Compare features vs. implementation effort

2. **Consider Custom Solution**
   - If staying with React Flow is essential
   - Budget 2-3 weeks for proper orthogonal routing
   - Study ELK's routing algorithms for reference

### Long Term
- Monitor React Flow updates for edge routing improvements
- Consider contributing edge bundling feature to React Flow
- Evaluate if graph density requires different visualization approach

---

## Lessons Learned

1. **React Flow's Edge Rendering is Simplified**
   - Designed for clarity and performance
   - Not built for complex routing scenarios
   - Custom edges are powerful but have limitations

2. **ELK and ReactFlow Have Different Responsibilities**
   - ELK: Node positioning and high-level routing
   - ReactFlow: Rendering and interaction
   - The gap between them is hard to bridge

3. **Edge Separation is Harder Than It Looks**
   - Requires global knowledge of all edges
   - Coordinate system challenges
   - Complex algorithms for proper routing

4. **Sometimes Simple is Better**
   - Standard smoothstep works well for most cases
   - Focus on other features (focus mode) to manage complexity
   - Perfect edge separation may not be worth the effort

---

## Code Artifacts (For Reference)

### Files Created (Not Currently Used)
- `src/components/edges/ElkEdge.tsx` - ELK orthogonal routing wrapper
- `src/components/edges/OffsetSmoothStepEdge.tsx` - Offset-based smoothstep

### Configuration Changes (Active)
```typescript
// src/lib/elkMapper.ts
'elk.layered.spacing.edgeEdgeBetweenLayers': '16',
'elk.spacing.edgeEdge': '16',
```

### Configuration Reverted
- `'elk.edgeRouting': 'ORTHOGONAL'` - Removed, caused issues

---

## Conclusion

Edge-to-edge separation in React Flow with ELK layouts is technically challenging and may not be worth the complexity for this project. The current approach (standard smoothstep with ELK spacing hints) provides reasonable results for most use cases. If perfect edge separation becomes critical, consider alternative visualization libraries or budget significant time for a custom routing solution.

**Status**: Investigation complete. Current simple solution is recommended unless requirements change significantly.
