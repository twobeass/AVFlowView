/**
 * Edge Routing Post-Processing Module
 * 
 * This module provides intelligent edge path adjustment after ELK layout
 * to ensure edges don't pass through nodes and are properly routed around obstacles.
 */

interface NodeBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

const EDGE_NODE_PADDING = 40; // Padding around nodes to avoid edges

/**
 * Get all node bounding boxes from ReactFlow nodes
 */
export function getNodeBounds(nodes: any[]): NodeBounds[] {
  return nodes.map((node) => ({
    id: node.id,
    x: node.position.x,
    y: node.position.y,
    width: node.style?.width || node.measured?.width || 440,
    height: node.style?.height || node.measured?.height || 100,
  }));
}

/**
 * Check if a line segment intersects with a node's bounding box
 */
function lineIntersectsNode(
  p1: Point,
  p2: Point,
  nodeBounds: NodeBounds,
  padding = EDGE_NODE_PADDING
): boolean {
  const x_min = nodeBounds.x - padding;
  const x_max = nodeBounds.x + nodeBounds.width + padding;
  const y_min = nodeBounds.y - padding;
  const y_max = nodeBounds.y + nodeBounds.height + padding;

  // Check if either endpoint is inside the padded box
  if ((p1.x >= x_min && p1.x <= x_max && p1.y >= y_min && p1.y <= y_max) ||
      (p2.x >= x_min && p2.x <= x_max && p2.y >= y_min && p2.y <= y_max)) {
    return true;
  }

  // Check if line segment intersects box boundaries
  return lineSegmentIntersectsBox(p1, p2, { x1: x_min, y1: y_min, x2: x_max, y2: y_max });
}

/**
 * Check if a line segment intersects with a rectangular box
 */
function lineSegmentIntersectsBox(
  p1: Point,
  p2: Point,
  box: { x1: number; y1: number; x2: number; y2: number }
): boolean {
  const x_min = Math.min(box.x1, box.x2);
  const x_max = Math.max(box.x1, box.x2);
  const y_min = Math.min(box.y1, box.y2);
  const y_max = Math.max(box.y1, box.y2);

  // Check intersection with each side of the box
  return (
    lineIntersectsLine(p1, p2, { x: x_min, y: y_min }, { x: x_max, y: y_min }) ||
    lineIntersectsLine(p1, p2, { x: x_max, y: y_min }, { x: x_max, y: y_max }) ||
    lineIntersectsLine(p1, p2, { x: x_max, y: y_max }, { x: x_min, y: y_max }) ||
    lineIntersectsLine(p1, p2, { x: x_min, y: y_max }, { x: x_min, y: y_min })
  );
}

/**
 * Check if two line segments intersect
 */
function lineIntersectsLine(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const ccw = (A: Point, B: Point, C: Point) =>
    (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);

  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

/**
 * Adjust edge path to avoid colliding with nodes
 * Creates intermediate waypoints to route around obstacles
 */
export function adjustEdgePath(
  startPoint: Point,
  endPoint: Point,
  nodeBounds: NodeBounds[],
  otherNodeIds: Set<string> = new Set()
): Point[] {
  const path: Point[] = [startPoint];
  const obstacleNodes = nodeBounds.filter((nb) => !otherNodeIds.has(nb.id));

  if (obstacleNodes.length === 0) {
    path.push(endPoint);
    return path;
  }

  // Check if direct path collides with any nodes
  let hasCollision = false;
  let collidingNodes: NodeBounds[] = [];

  for (const node of obstacleNodes) {
    if (lineIntersectsNode(startPoint, endPoint, node)) {
      hasCollision = true;
      collidingNodes.push(node);
    }
  }

  if (!hasCollision) {
    path.push(endPoint);
    return path;
  }

  // If there are collisions, create a path around the obstacles
  // Strategy: Move to the side of the obstacle(s), then continue to endpoint
  const boundingBox = calculateBoundingBox(collidingNodes);

  // Determine which side to route around
  const startToEnd = { x: endPoint.x - startPoint.x, y: endPoint.y - startPoint.y };
  const magnitude = Math.hypot(startToEnd.x, startToEnd.y);
  const directionX = startToEnd.x / magnitude;
  const directionY = startToEnd.y / magnitude;

  // Perpendicular direction (to the right of the path)
  const perpX = -directionY;
  const perpY = directionX;

  // Create waypoint to the side
  const detourDistance = Math.max(boundingBox.width, boundingBox.height) / 2 + EDGE_NODE_PADDING;
  const midpoint = {
    x: (startPoint.x + endPoint.x) / 2,
    y: (startPoint.y + endPoint.y) / 2,
  };

  const waypoint1 = {
    x: midpoint.x + perpX * detourDistance,
    y: midpoint.y + perpY * detourDistance,
  };

  path.push(waypoint1);
  path.push(endPoint);

  return path;
}

/**
 * Calculate bounding box for multiple nodes
 */
function calculateBoundingBox(nodes: NodeBounds[]): { x: number; y: number; width: number; height: number } {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = nodes[0].x;
  let minY = nodes[0].y;
  let maxX = nodes[0].x + nodes[0].width;
  let maxY = nodes[0].y + nodes[0].height;

  for (const node of nodes.slice(1)) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Process all edges and adjust their paths to avoid node collisions
 */
export function processEdgePaths(
  edges: any[],
  nodes: any[],
  elkLayout: any
): any[] {
  const nodeBounds = getNodeBounds(nodes);
  const nodeMap = new Map(nodeBounds.map((nb) => [nb.id, nb]));

  // Extract edge path information from ELK layout
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

  // Process each edge
  const processedEdges = edges.map((edge) => {
    const elkEdge = elkEdges.get(edge.id);
    if (!elkEdge || !elkEdge.sections || elkEdge.sections.length === 0) {
      return edge;
    }

    const section = elkEdge.sections[0];
    const startPoint = section.startPoint;
    const endPoint = section.endPoint;

    if (!startPoint || !endPoint) {
      return edge;
    }

    // Get source and target nodes
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (!sourceNode || !targetNode) {
      return edge;
    }

    // Calculate adjusted path, excluding start and end nodes
    const otherNodeIds = new Set([edge.source, edge.target]);
    const adjustedPath = adjustEdgePath(startPoint, endPoint, nodeBounds, otherNodeIds);

    return {
      ...edge,
      controlPoints: adjustedPath.slice(1, -1), // Exclude start and end
    };
  });

  return processedEdges;
}
