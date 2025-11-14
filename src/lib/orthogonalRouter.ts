/**
 * High-Performance Orthogonal Edge Router with A* Pathfinding
 * 
 * This module provides intelligent edge routing that:
 * - Avoids all node obstacles using A* pathfinding
 * - Creates orthogonal (horizontal/vertical) paths with multiple waypoints
 * - Separates parallel edges for visual clarity
 * - Optimizes performance for graphs with thousands of edges
 */

interface Point {
  x: number;
  y: number;
}

interface NodeBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GridCell {
  x: number;
  y: number;
  walkable: boolean;
}

interface PathNode {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic to goal
  f: number; // Total cost
  parent: PathNode | null;
}

const EDGE_NODE_PADDING = 50; // Padding around nodes
const GRID_CELL_SIZE = 30; // Size of each grid cell for pathfinding
const EDGE_SEPARATION = 12; // Distance between parallel edges

/**
 * Spatial Grid for efficient collision detection
 */
class SpatialGrid {
  private cellSize: number;
  private obstacles: Set<string>;
  private bounds: { minX: number; minY: number; maxX: number; maxY: number };

  constructor(cellSize: number = GRID_CELL_SIZE) {
    this.cellSize = cellSize;
    this.obstacles = new Set();
    this.bounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  /**
   * Add node obstacles to the grid
   */
  addNodeObstacles(nodes: NodeBounds[], padding: number = EDGE_NODE_PADDING): void {
    nodes.forEach(node => {
      const x1 = Math.floor((node.x - padding) / this.cellSize);
      const y1 = Math.floor((node.y - padding) / this.cellSize);
      const x2 = Math.ceil((node.x + node.width + padding) / this.cellSize);
      const y2 = Math.ceil((node.y + node.height + padding) / this.cellSize);

      // Update bounds
      this.bounds.minX = Math.min(this.bounds.minX, x1);
      this.bounds.minY = Math.min(this.bounds.minY, y1);
      this.bounds.maxX = Math.max(this.bounds.maxX, x2);
      this.bounds.maxY = Math.max(this.bounds.maxY, y2);

      // Mark all cells within the padded node as obstacles
      for (let x = x1; x <= x2; x++) {
        for (let y = y1; y <= y2; y++) {
          this.obstacles.add(`${x},${y}`);
        }
      }
    });
  }

  /**
   * Check if a cell is walkable (not an obstacle)
   */
  isWalkable(x: number, y: number): boolean {
    return !this.obstacles.has(`${x},${y}`);
  }

  /**
   * Convert world coordinates to grid coordinates
   */
  worldToGrid(point: Point): Point {
    return {
      x: Math.floor(point.x / this.cellSize),
      y: Math.floor(point.y / this.cellSize)
    };
  }

  /**
   * Convert grid coordinates to world coordinates
   */
  gridToWorld(gridPoint: Point): Point {
    return {
      x: gridPoint.x * this.cellSize + this.cellSize / 2,
      y: gridPoint.y * this.cellSize + this.cellSize / 2
    };
  }

  getBounds() {
    return this.bounds;
  }
}

/**
 * Manhattan distance heuristic for A*
 */
function manhattanDistance(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * A* Pathfinding algorithm for orthogonal routing
 */
function findOrthogonalPath(
  start: Point,
  end: Point,
  grid: SpatialGrid
): Point[] {
  const startGrid = grid.worldToGrid(start);
  const endGrid = grid.worldToGrid(end);

  // Check if start or end is in obstacle
  if (!grid.isWalkable(startGrid.x, startGrid.y) || !grid.isWalkable(endGrid.x, endGrid.y)) {
    // Return direct path as fallback
    return [start, end];
  }

  const openSet: PathNode[] = [];
  const closedSet = new Set<string>();
  const openSetMap = new Map<string, PathNode>();

  const startNode: PathNode = {
    x: startGrid.x,
    y: startGrid.y,
    g: 0,
    h: manhattanDistance(startGrid, endGrid),
    f: 0,
    parent: null
  };
  startNode.f = startNode.g + startNode.h;

  openSet.push(startNode);
  openSetMap.set(`${startNode.x},${startNode.y}`, startNode);

  const directions = [
    { x: 0, y: -1 }, // North
    { x: 1, y: 0 },  // East
    { x: 0, y: 1 },  // South
    { x: -1, y: 0 }  // West
  ];

  let iterations = 0;
  const maxIterations = 10000; // Prevent infinite loops

  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++;

    // Get node with lowest f-score
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;
    const currentKey = `${current.x},${current.y}`;

    openSetMap.delete(currentKey);
    closedSet.add(currentKey);

    // Check if we reached the goal
    if (current.x === endGrid.x && current.y === endGrid.y) {
      // Reconstruct path
      const path: Point[] = [];
      let node: PathNode | null = current;
      
      while (node !== null) {
        path.unshift(grid.gridToWorld({ x: node.x, y: node.y }));
        node = node.parent;
      }

      // Replace first and last points with exact start/end
      if (path.length > 0) {
        path[0] = start;
        path[path.length - 1] = end;
      }

      return path;
    }

    // Explore neighbors
    for (const dir of directions) {
      const neighborX = current.x + dir.x;
      const neighborY = current.y + dir.y;
      const neighborKey = `${neighborX},${neighborY}`;

      // Skip if already evaluated or not walkable
      if (closedSet.has(neighborKey) || !grid.isWalkable(neighborX, neighborY)) {
        continue;
      }

      const gScore = current.g + 1;
      const existingNeighbor = openSetMap.get(neighborKey);

      if (!existingNeighbor || gScore < existingNeighbor.g) {
        const neighbor: PathNode = {
          x: neighborX,
          y: neighborY,
          g: gScore,
          h: manhattanDistance({ x: neighborX, y: neighborY }, endGrid),
          f: 0,
          parent: current
        };
        neighbor.f = neighbor.g + neighbor.h;

        if (!existingNeighbor) {
          openSet.push(neighbor);
          openSetMap.set(neighborKey, neighbor);
        } else {
          // Update existing neighbor
          existingNeighbor.g = gScore;
          existingNeighbor.f = gScore + existingNeighbor.h;
          existingNeighbor.parent = current;
        }
      }
    }
  }

  // No path found, return direct path
  return [start, end];
}

/**
 * Optimize path by removing redundant waypoints and merging collinear segments
 */
function optimizePath(waypoints: Point[]): Point[] {
  if (waypoints.length <= 2) {
    return waypoints;
  }

  const optimized: Point[] = [waypoints[0]];

  for (let i = 1; i < waypoints.length - 1; i++) {
    const prev = waypoints[i - 1];
    const current = waypoints[i];
    const next = waypoints[i + 1];

    // Check if current point is on a straight line between prev and next
    const isHorizontal = prev.y === current.y && current.y === next.y;
    const isVertical = prev.x === current.x && current.x === next.x;

    // Keep the point if it's a direction change
    if (!isHorizontal && !isVertical) {
      optimized.push(current);
    }
  }

  optimized.push(waypoints[waypoints.length - 1]);

  return optimized;
}

/**
 * Detect and group parallel edges (same source and target)
 */
function groupParallelEdges(edges: any[]): Map<string, any[]> {
  const groups = new Map<string, any[]>();

  edges.forEach(edge => {
    const key = `${edge.source}-${edge.target}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(edge);
  });

  return groups;
}

/**
 * Calculate perpendicular offset vector for edge separation
 */
function calculatePerpendicularOffset(p1: Point, p2: Point, distance: number): Point {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) {
    return { x: 0, y: distance };
  }

  // Perpendicular vector (rotated 90 degrees)
  const perpX = -dy / length;
  const perpY = dx / length;

  return {
    x: perpX * distance,
    y: perpY * distance
  };
}

/**
 * Apply separation offset to all waypoints in a path
 */
function offsetPath(waypoints: Point[], offset: Point): Point[] {
  return waypoints.map(point => ({
    x: point.x + offset.x,
    y: point.y + offset.y
  }));
}

/**
 * Separate parallel edges by applying perpendicular offsets
 */
function separateParallelEdges(
  edges: any[],
  edgePaths: Map<string, Point[]>,
  separationDistance: number = EDGE_SEPARATION
): Map<string, Point[]> {
  const groups = groupParallelEdges(edges);
  const separatedPaths = new Map<string, Point[]>();

  groups.forEach((groupEdges, _key) => {
    if (groupEdges.length === 1) {
      // Single edge, no separation needed
      const edge = groupEdges[0];
      const path = edgePaths.get(edge.id);
      if (path) {
        separatedPaths.set(edge.id, path);
      }
      return;
    }

    // Multiple parallel edges - apply offsets
    const numEdges = groupEdges.length;
    groupEdges.forEach((edge, index) => {
      const path = edgePaths.get(edge.id);
      if (!path || path.length < 2) {
        separatedPaths.set(edge.id, path || []);
        return;
      }

      // Calculate offset: distribute edges evenly around center
      const offsetMultiplier = index - (numEdges - 1) / 2;
      const offset = calculatePerpendicularOffset(
        path[0],
        path[1],
        offsetMultiplier * separationDistance
      );

      const offsettedPath = offsetPath(path, offset);
      separatedPaths.set(edge.id, offsettedPath);
    });
  });

  return separatedPaths;
}

/**
 * Main function: Process all edges with orthogonal routing
 */
export function processOrthogonalRouting(
  edges: any[],
  nodes: any[],
  elkLayout: any
): any[] {
  // Build node bounds
  const nodeBounds: NodeBounds[] = nodes.map(node => ({
    id: node.id,
    x: node.position.x,
    y: node.position.y,
    width: node.style?.width || node.measured?.width || 440,
    height: node.style?.height || node.measured?.height || 100
  }));

  // Create spatial grid
  const grid = new SpatialGrid(GRID_CELL_SIZE);
  grid.addNodeObstacles(nodeBounds, EDGE_NODE_PADDING);

  // Extract edge sections from ELK layout
  const elkEdges = new Map<string, any>();

  function collectElkEdges(elkNode: any) {
    if (elkNode.edges) {
      elkNode.edges.forEach((edge: any) => {
        elkEdges.set(edge.id, edge);
      });
    }
    if (elkNode.children) {
      elkNode.children.forEach((child: any) => collectElkEdges(child));
    }
  }

  if (elkLayout.children) {
    elkLayout.children.forEach((child: any) => collectElkEdges(child));
  }
  if (elkLayout.edges) {
    elkLayout.edges.forEach((edge: any) => {
      elkEdges.set(edge.id, edge);
    });
  }

  // First pass: Calculate paths for all edges
  const edgePaths = new Map<string, Point[]>();

  edges.forEach(edge => {
    const elkEdge = elkEdges.get(edge.id);
    if (!elkEdge || !elkEdge.sections || elkEdge.sections.length === 0) {
      edgePaths.set(edge.id, []);
      return;
    }

    const section = elkEdge.sections[0];
    const startPoint = section.startPoint;
    const endPoint = section.endPoint;

    if (!startPoint || !endPoint) {
      edgePaths.set(edge.id, []);
      return;
    }

    // Check if ELK already provided bend points (orthogonal routing)
    const elkBendPoints = section.bendPoints || [];
    
    if (elkBendPoints.length > 0) {
      // ELK provided orthogonal path, use it with optimization
      let path = [startPoint, ...elkBendPoints, endPoint];
      path = optimizePath(path);
      edgePaths.set(edge.id, path);
    } else {
      // No bend points from ELK, use A* pathfinding
      let path = findOrthogonalPath(startPoint, endPoint, grid);
      path = optimizePath(path);
      edgePaths.set(edge.id, path);
    }
  });

  // Second pass: Separate parallel edges
  const separatedPaths = separateParallelEdges(edges, edgePaths, EDGE_SEPARATION);

  // Third pass: Apply paths to edges
  const processedEdges = edges.map(edge => {
    const path = separatedPaths.get(edge.id) || [];
    
    // Control points are all waypoints except start and end
    const controlPoints = path.length > 2 ? path.slice(1, -1) : [];

    return {
      ...edge,
      data: {
        ...edge.data,
        controlPoints,
        fullPath: path // Store full path for debugging
      }
    };
  });

  return processedEdges;
}

/**
 * Get node bounds helper (exported for compatibility)
 */
export function getNodeBounds(nodes: any[]): NodeBounds[] {
  return nodes.map(node => ({
    id: node.id,
    x: node.position.x,
    y: node.position.y,
    width: node.style?.width || node.measured?.width || 440,
    height: node.style?.height || node.measured?.height || 100
  }));
}
