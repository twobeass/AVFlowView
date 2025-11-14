# Auto-Routing System - Current Implementation Status

## Executive Summary
The AVFlowView edge auto-routing system uses ELK.js with ORTHOGONAL routing to create clean horizontal/vertical paths between nodes. The system includes rounded corners for visual appeal and buffer zones around nodes to minimize edge crossings when nodes are moved.

**Current Status:** ✅ FUNCTIONAL with known limitations
- Edges render correctly with orthogonal (horizontal/vertical) segments
- Rounded corners (14px radius) provide smooth visual appearance
- 30px buffer zones at start/end of edges provide tolerance for node movement
- Some edge crossings still occur in complex graphs (acceptable trade-off)

## Current Implementation

### Architecture Overview

```
Graph Data 
  ↓
ELK Layout Engine (elkMapper.ts)
  ├─ Priority-based node ordering
  ├─ ORTHOGONAL edge routing
  ├─ Bidirectional port resolution
  └─ BendPoint calculation
  ↓
SmartEdge Component (SmartEdge.tsx)
  ├─ Collinear point detection
  ├─ Buffer zone addition
  ├─ Rounded corner rendering
  └─ SVG path generation
```

### Key Components

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/elkMapper.ts` | ELK layout + node/edge processing | ✅ Working |
| `src/components/edges/SmartEdge.tsx` | Edge rendering with rounded corners | ✅ Working |
| `src/components/AVWiringViewer.tsx` | Integration layer | ✅ Working |
| `src/lib/edgeRouting.ts` | Legacy post-processing (unused) | ⚠️ Deprecated |
| `src/lib/orthogonalRouter.ts` | Custom router (unused) | ⚠️ Deprecated |

### Implementation Details

#### 1. ELK Configuration (elkMapper.ts)

**Layout Algorithm:** `layered`
- Best for hierarchical graphs with directional flow
- Organizes nodes into layers based on edge direction

**Edge Routing:** `ORTHOGONAL`
- Creates horizontal/vertical paths only (no diagonal segments)
- Automatically calculates bendPoints to avoid node overlaps
- Better than SPLINES for schematic-style diagrams

**Key ELK Options:**
```javascript
'elk.algorithm': 'layered'
'elk.direction': 'RIGHT'  // LR layout
'elk.edgeRouting': 'ORTHOGONAL'
'elk.spacing.nodeNode': '140'
'elk.layered.spacing.nodeNodeBetweenLayers': '200'
'elk.layered.spacing.edgeNodeBetweenLayers': '120'
'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP'
'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX'
```

**Node Priority System:**
- Computes average port index for each node's connections
- Uses priority to influence node ordering within layers
- Helps align nodes with similar port usage patterns
- Reduces edge crossings by keeping related nodes close

**Bidirectional Port Resolution:**
- Ports with `alignment: 'In/Out'` are initially marked as bidirectional
- After ELK layout, port sides are resolved based on neighbor positions
- Ensures ports face their connected neighbors correctly
- Prevents backwards-facing ports

#### 2. Smart Edge Rendering (SmartEdge.tsx)

**Routing Strategy:**
1. Receive elkPoints (bendPoints) from ELK layout
2. Detect collinear bendPoints (all on same X or Y line)
3. Filter out redundant intermediate points
4. Add 30px buffer segments at start and end
5. Generate SVG path with rounded corners

**Collinear Detection:**
- Checks if all bendPoints share same X coordinate (vertical routing)
- Or if all share same Y coordinate (horizontal routing)
- Simplifies routing for straight-line connections
- Reduces unnecessary waypoints

**Buffer Zones:**
- Minimum 30px horizontal segments at start and end
- Prevents edges from immediately turning at port connection
- Provides tolerance for node movement without edge recalculation
- Reduces edge crossings when nodes are repositioned

**Rounded Corners:**
- 14px arc radius at each orthogonal corner
- Uses SVG arc commands (A) for smooth curves
- Dynamically adjusts radius for short segments
- Cross product determines clockwise/counterclockwise sweep

**Path Generation:**
```javascript
// For each corner waypoint:
1. Calculate approach point (before corner)
2. Calculate exit point (after corner)
3. Draw line to approach point
4. Draw arc from approach to exit
5. Continue to next waypoint
```

### Data Flow

```javascript
// 1. ELK Layout produces bendPoints
edge.sections[0].bendPoints = [
  { x: 600, y: 152 },
  { x: 600, y: 384 }
]

// 2. SmartEdge detects collinear points (both at x=600)
// 3. Creates waypoints with buffer zones:
waypoints = [
  { x: sourceX + 30, y: sourceY },  // Start buffer
  { x: 600, y: sourceY },            // Route to column
  { x: 600, y: targetY },            // Route along column
  { x: targetX - 30, y: targetY }   // End buffer
]

// 4. Generates SVG path with rounded corners
pathData = "M sourceX sourceY L ... A 14 14 0 0 1 ... L targetX targetY"
```

## Known Issues

### 1. Edge Crossings in Complex Graphs
**Description:** Edges may still cross each other despite ELK's crossing minimization
**Cause:** 
- ELK's ORTHOGONAL routing minimizes but doesn't eliminate crossings
- Node placement algorithm prioritizes layer assignment over edge separation
- Complex graphs with many interconnections are difficult to route perfectly
**Impact:** Moderate - affects readability in dense graphs
**Workaround:** Use focus mode to view subsets of the graph

### 2. Dense Graph Performance
**Description:** Layout calculation takes longer for graphs with 50+ nodes
**Cause:** ELK's thoroughness setting (20) performs extensive optimization
**Impact:** Minor - typically < 1 second delay
**Workaround:** Consider reducing thoroughness for very large graphs

### 3. Node Movement Edge Crossings
**Description:** Moving nodes manually can create temporary edge crossings
**Cause:** Edges are not recalculated until next layout refresh
**Impact:** Minor - resolved on next layout update
**Workaround:** Trigger layout refresh after moving nodes

## Configuration Parameters

### Tunable Constants

#### SmartEdge.tsx
```javascript
const CORNER_RADIUS = 14;        // Arc radius for rounded corners (px)
const MIN_SEGMENT_LENGTH = 30;   // Buffer zone length (px)
const EPSILON = 0.5;             // Floating-point comparison tolerance
```

**Recommendations:**
- Increase `CORNER_RADIUS` (up to 20) for smoother appearance
- Increase `MIN_SEGMENT_LENGTH` (up to 50) if nodes move frequently
- Do not modify `EPSILON` unless precision issues occur

#### elkMapper.ts
```javascript
const NODE_WIDTH = 440;          // Node box width (px)
const NODE_HEIGHT = 100;         // Base node height (px)
const PORT_HEIGHT_SPACING = 20;  // Additional height per port (px)
```

**Key ELK Spacing Parameters:**
- `elk.spacing.nodeNode: '140'` - Space between nodes in same layer
- `elk.layered.spacing.nodeNodeBetweenLayers: '200'` - Space between layers
- `elk.layered.spacing.edgeNodeBetweenLayers: '120'` - Edge-node spacing between layers
- `elk.spacing.edgeNode: '90'` - General edge-node spacing

**Recommendations to Reduce Crossings:**
- Increase `nodeNodeBetweenLayers` (up to 300) for more horizontal space
- Increase `edgeNodeBetweenLayers` (up to 150) for better edge separation
- Trade-off: Larger spacing = less compact layout

## Testing Scenarios

### Test Cases Verified
1. ✅ **Simple Linear:** A→B→C shows straight edges with rounded corners
2. ✅ **Parallel Edges:** Multiple edges between layers route without overlap
3. ✅ **Bidirectional Ports:** Ports face correct direction based on connections
4. ✅ **Collinear Routing:** Vertical/horizontal routing uses simplified waypoints
5. ✅ **Buffer Zones:** 30px segments at start/end prevent immediate port turns
6. ⚠️ **Complex Dense Graph:** Some crossings occur (acceptable trade-off)

### Known Test Failures
1. ⚠️ **Very Dense Graphs (50+ nodes, 100+ edges):** Crossings increase significantly
2. ⚠️ **Crossing Detection:** No automated detection/reporting of edge crossings

## Future Improvements

### High Priority
1. **Advanced Crossing Detection**
   - Implement post-layout crossing detection algorithm
   - Report crossing statistics to user
   - Highlight problematic edges in UI

2. **Edge Bundling**
   - Group parallel edges between same node pairs
   - Apply curve offsets to bundled edges
   - Reduce visual clutter in dense areas

3. **Custom Node Placement**
   - Pre-process graph to optimize node ordering
   - Use port connection patterns to guide placement
   - May provide better results than ELK's default algorithm

### Medium Priority
4. **Alternative Layout Algorithms**
   - Test ELK's FORCE-directed layout
   - Test ELK's STRESS layout
   - Compare results for different graph types

5. **Interactive Edge Routing**
   - Allow manual edge path adjustment
   - Persist custom routes across layout updates
   - Provide "straighten edge" action

6. **Performance Optimization**
   - Cache layout results for unchanged graphs
   - Implement incremental layout updates
   - Use web workers for layout calculation

### Low Priority
7. **Edge Style Variants**
   - Different corner radius per edge type
   - Color-coded edges by signal type
   - Animated edges for active signals

8. **Advanced Port Handling**
   - Port groups that bundle multiple connections
   - Hierarchical port expansion/collapse
   - Port highlighting on hover

## Comparison with Previous Approaches

### SPLINES Routing (Deprecated)
- **Pros:** Smooth curves, visually appealing
- **Cons:** Edges routed through nodes, no collision avoidance
- **Verdict:** Replaced with ORTHOGONAL

### Post-Processing with edgeRouting.ts (Deprecated)
- **Pros:** Attempted to fix overlaps after layout
- **Cons:** Too late in pipeline, created awkward paths
- **Verdict:** Removed in favor of better ELK configuration

### Custom A* Pathfinding (Attempted, Removed)
- **Pros:** Complete control over routing
- **Cons:** Complex implementation, performance issues
- **Verdict:** ELK's built-in routing is more reliable

## Recommendations

### For Best Results
1. **Use Focus Mode** for viewing complex subsections
2. **Group related nodes** in areas to reduce edge spans
3. **Minimize bidirectional connections** when possible
4. **Use consistent port naming** to help priority system

### When to Accept Crossings
- Graphs with > 30 nodes and > 50 edges will have some crossings
- Dense interconnection patterns are inherently difficult to route
- Perfect zero-crossing layouts may not exist for complex graphs
- Current implementation provides good balance of quality and performance

### When to Revisit Layout
- If > 20% of edges cross
- If specific edges consistently problematic
- If user feedback indicates readability issues
- Consider custom node grouping or graph simplification

## References
- ELK.js Documentation: https://www.eclipse.org/elk/documentation.html
- Layered Algorithm: https://www.eclipse.org/elk/reference/algorithms/org-eclipse-elk-layered.html
- ORTHOGONAL Routing: https://www.eclipse.org/elk/reference/options/org-eclipse-elk-edgeRouting.html
- @xyflow/react: https://reactflow.dev/api-reference/

---
**Last Updated:** 2025-11-14
**Status:** PRODUCTION READY with known limitations
**Next Review:** When implementing advanced crossing detection
