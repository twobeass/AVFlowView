/**
 * Point and geometry utilities for edge routing
 */

import type { ControlPoint, HandlePosition, HandlePositionType, NodeRect } from '../types';

/**
 * Check if two points are equal
 */
export const isEqualPoint = (p1: ControlPoint, p2: ControlPoint): boolean => {
  return p1.x === p2.x && p1.y === p2.y;
};

/**
 * Check if a position is horizontal (left or right)
 */
export const isHorizontalFromPosition = (position: HandlePositionType): boolean => {
  return position === 'left' || position === 'right';
};

/**
 * Get offset point from a handle position
 */
export const getOffsetPoint = (
  handle: HandlePosition,
  offset: number
): ControlPoint => {
  const { x, y, position } = handle;
  switch (position) {
    case 'top':
      return { x, y: y - offset };
    case 'bottom':
      return { x, y: y + offset };
    case 'left':
      return { x: x - offset, y };
    case 'right':
      return { x: x + offset, y };
  }
};

/**
 * Expand a rectangle by an offset amount on all sides
 */
export const getExpandedRect = (rect: NodeRect, offset: number): NodeRect => {
  return {
    x: rect.x - offset,
    y: rect.y - offset,
    width: rect.width + 2 * offset,
    height: rect.height + 2 * offset,
  };
};

/**
 * Get the bounding box sides from a set of points
 */
export const getSidesFromPoints = (points: ControlPoint[]) => {
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;

  for (const p of points) {
    left = Math.min(left, p.x);
    right = Math.max(right, p.x);
    top = Math.min(top, p.y);
    bottom = Math.max(bottom, p.y);
  }

  return { left, right, top, bottom };
};

/**
 * Get vertices from a rectangle that are visible from a target point
 */
export const getVerticesFromRectVertex = (
  rect: NodeRect,
  targetPoint: ControlPoint
): ControlPoint[] => {
  const { x, y, width, height } = rect;
  const rectCenter = {
    x: x + width / 2,
    y: y + height / 2,
  };

  const vertices: ControlPoint[] = [];

  // Add corners based on which quadrant the target is in
  if (targetPoint.x < rectCenter.x) {
    // Target is to the left
    vertices.push({ x, y }, { x, y: y + height });
  } else {
    // Target is to the right
    vertices.push({ x: x + width, y }, { x: x + width, y: y + height });
  }

  if (targetPoint.y < rectCenter.y) {
    // Target is above
    vertices.push({ x, y }, { x: x + width, y });
  } else {
    // Target is below
    vertices.push({ x, y: y + height }, { x: x + width, y: y + height });
  }

  return vertices;
};

/**
 * Get center points between two rectangles for potential routing
 */
export const getCenterPoints = ({
  source,
  target,
  sourceOffset,
  targetOffset,
}: {
  source: NodeRect;
  target: NodeRect;
  sourceOffset: ControlPoint;
  targetOffset: ControlPoint;
}): ControlPoint[] => {
  const points: ControlPoint[] = [];

  // Horizontal center lines
  points.push(
    { x: sourceOffset.x, y: targetOffset.y },
    { x: targetOffset.x, y: sourceOffset.y }
  );

  // Vertical center lines at source and target
  const sourceCenterY = source.y + source.height / 2;
  const targetCenterY = target.y + target.height / 2;
  points.push(
    { x: sourceOffset.x, y: sourceCenterY },
    { x: targetOffset.x, y: sourceCenterY },
    { x: sourceOffset.x, y: targetCenterY },
    { x: targetOffset.x, y: targetCenterY }
  );

  // Horizontal center lines at source and target
  const sourceCenterX = source.x + source.width / 2;
  const targetCenterX = target.x + target.width / 2;
  points.push(
    { x: sourceCenterX, y: sourceOffset.y },
    { x: sourceCenterX, y: targetOffset.y },
    { x: targetCenterX, y: sourceOffset.y },
    { x: targetCenterX, y: targetOffset.y }
  );

  return points;
};

/**
 * Check if a line segment crosses a rectangle
 */
export const isSegmentCrossingRect = (
  p1: ControlPoint,
  p2: ControlPoint,
  rect: NodeRect
): boolean => {
  const { x, y, width, height } = rect;
  const left = x;
  const right = x + width;
  const top = y;
  const bottom = y + height;

  // Check if segment is completely outside rectangle
  if (
    (p1.x < left && p2.x < left) ||
    (p1.x > right && p2.x > right) ||
    (p1.y < top && p2.y < top) ||
    (p1.y > bottom && p2.y > bottom)
  ) {
    return false;
  }

  // Check if segment endpoints are inside rectangle
  const p1Inside =
    p1.x >= left && p1.x <= right && p1.y >= top && p1.y <= bottom;
  const p2Inside =
    p2.x >= left && p2.x <= right && p2.y >= top && p2.y <= bottom;

  if (p1Inside || p2Inside) {
    return true;
  }

  // Check intersection with rectangle edges
  const rectEdges = [
    [{ x: left, y: top }, { x: right, y: top }],     // Top edge
    [{ x: right, y: top }, { x: right, y: bottom }], // Right edge
    [{ x: right, y: bottom }, { x: left, y: bottom }], // Bottom edge
    [{ x: left, y: bottom }, { x: left, y: top }],   // Left edge
  ];

  for (const [e1, e2] of rectEdges) {
    if (doSegmentsIntersect(p1, p2, e1 as ControlPoint, e2 as ControlPoint)) {
      return true;
    }
  }

  return false;
};

/**
 * Check if two line segments intersect
 */
const doSegmentsIntersect = (
  p1: ControlPoint,
  p2: ControlPoint,
  p3: ControlPoint,
  p4: ControlPoint
): boolean => {
  const det =
    (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);

  if (det === 0) {
    return false; // Lines are parallel
  }

  const lambda =
    ((p4.y - p3.y) * (p4.x - p1.x) + (p3.x - p4.x) * (p4.y - p1.y)) / det;
  const gamma =
    ((p1.y - p2.y) * (p4.x - p1.x) + (p2.x - p1.x) * (p4.y - p1.y)) / det;

  return lambda > 0 && lambda < 1 && gamma > 0 && gamma < 1;
};

/**
 * Optimize and clean up control points
 */
export const optimizeInputPoints = ({
  source,
  target,
  sourceOffset,
  targetOffset,
  edgePoints,
}: {
  source: HandlePosition;
  target: HandlePosition;
  sourceOffset: ControlPoint;
  targetOffset: ControlPoint;
  edgePoints: ControlPoint[];
}): {
  source: ControlPoint;
  target: ControlPoint;
  edgePoints: ControlPoint[];
} => {
  const threshold = 5; // Merge points within this distance
  const optimizedPoints: ControlPoint[] = [];
  
  // Add source offset
  optimizedPoints.push(sourceOffset);

  // Merge nearby points and remove duplicates
  for (const point of edgePoints) {
    if (
      isEqualPoint(point, sourceOffset) ||
      isEqualPoint(point, targetOffset)
    ) {
      continue;
    }

    const isDuplicate = optimizedPoints.some(
      (p) =>
        Math.abs(p.x - point.x) < threshold &&
        Math.abs(p.y - point.y) < threshold
    );

    if (!isDuplicate) {
      optimizedPoints.push(point);
    }
  }

  // Add target offset
  optimizedPoints.push(targetOffset);

  return {
    source: sourceOffset,
    target: targetOffset,
    edgePoints: optimizedPoints,
  };
};

/**
 * Reduce points by removing unnecessary intermediate points on straight lines
 */
export const reducePoints = (points: ControlPoint[]): ControlPoint[] => {
  if (points.length <= 2) {
    return points;
  }

  const reduced: ControlPoint[] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Check if current point is on a straight line between prev and next
    const isOnLine =
      (curr.x === prev.x && curr.x === next.x) ||
      (curr.y === prev.y && curr.y === next.y);

    if (!isOnLine) {
      reduced.push(curr);
    }
  }

  reduced.push(points[points.length - 1]);
  return reduced;
};
