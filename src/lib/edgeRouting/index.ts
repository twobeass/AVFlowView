/**
 * Main edge routing orchestrator
 * Calculates optimal control points for edges using A* pathfinding
 */

import type { ControlPoint, HandlePosition, NodeRect, EdgeRoutingConfig } from './types';
import { DEFAULT_EDGE_ROUTING_CONFIG } from './types';
import {
  getOffsetPoint,
  getExpandedRect,
  getSidesFromPoints,
  getVerticesFromRectVertex,
  getCenterPoints,
  optimizeInputPoints,
  reducePoints,
  isHorizontalFromPosition,
} from './geometry/point';
import { areLinesSameDirection } from './geometry/edge';
import { getAStarPath } from './algorithms/aStar';
import { getSimplePath } from './algorithms/simple';

export interface GetControlPointsParams {
  source: HandlePosition;
  target: HandlePosition;
  sourceRect: NodeRect;
  targetRect: NodeRect;
  offset?: number;
}

/**
 * Calculate control points on the optimal path of an edge.
 * 
 * This is the main entry point for edge routing.
 * Uses A* search algorithm for complex paths and simple routing for direct connections.
 */
export const getControlPoints = ({
  source: oldSource,
  target: oldTarget,
  sourceRect,
  targetRect,
  offset = DEFAULT_EDGE_ROUTING_CONFIG.offset,
}: GetControlPointsParams): {
  points: ControlPoint[];
  inputPoints: ControlPoint[];
} => {
  const source: ControlPoint = oldSource;
  const target: ControlPoint = oldTarget;
  let edgePoints: ControlPoint[] = [];
  let optimized: ReturnType<typeof optimizeInputPoints>;

  // 1. Find the starting and ending points after applying the offset
  const sourceOffset = getOffsetPoint(oldSource, offset);
  const targetOffset = getOffsetPoint(oldTarget, offset);
  const expandedSource = getExpandedRect(sourceRect, offset);
  const expandedTarget = getExpandedRect(targetRect, offset);

  // 2. Determine if the two Rects are relatively close or should be directly connected
  const minOffset = 2 * offset + 10;
  const isHorizontalLayout = isHorizontalFromPosition(oldSource.position);
  const isSameDirection = areLinesSameDirection(
    source,
    sourceOffset,
    targetOffset,
    target
  );
  const sides = getSidesFromPoints([
    source,
    target,
    sourceOffset,
    targetOffset,
  ]);
  const isTooClose = isHorizontalLayout
    ? sides.right - sides.left < minOffset
    : sides.bottom - sides.top < minOffset;
  const isDirectConnect = isHorizontalLayout
    ? isSameDirection && source.x < target.x
    : isSameDirection && source.y < target.y;

  if (isTooClose || isDirectConnect) {
    // 3. If the two Rects are relatively close or directly connected, return a simple Path
    edgePoints = getSimplePath({
      source: oldSource,
      target: oldTarget,
      sourceOffset,
      targetOffset,
      isDirectConnect,
    });
    optimized = optimizeInputPoints({
      source: oldSource,
      target: oldTarget,
      sourceOffset,
      targetOffset,
      edgePoints,
    });
    edgePoints = optimized.edgePoints;
  } else {
    // 3. Find the vertices of the two expanded Rects
    edgePoints = [
      ...getVerticesFromRectVertex(expandedSource, targetOffset),
      ...getVerticesFromRectVertex(expandedTarget, sourceOffset),
    ];

    // 4. Find possible midpoints and intersections
    edgePoints = edgePoints.concat(
      getCenterPoints({
        source: expandedSource,
        target: expandedTarget,
        sourceOffset,
        targetOffset,
      })
    );

    // 5. Merge nearby coordinate points and remove duplicate coordinate points
    optimized = optimizeInputPoints({
      source: oldSource,
      target: oldTarget,
      sourceOffset,
      targetOffset,
      edgePoints,
    });

    // 6. Find the optimal path using A*
    edgePoints = getAStarPath({
      points: optimized.edgePoints,
      source: optimized.source,
      target: optimized.target,
      sourceRect: getExpandedRect(sourceRect, offset / 2),
      targetRect: getExpandedRect(targetRect, offset / 2),
    });
  }

  return {
    points: reducePoints([optimized.source, ...edgePoints, optimized.target]),
    inputPoints: optimized.edgePoints,
  };
};

/**
 * Generate SVG path with rounded corners from control points
 */
export const generatePathWithRoundedCorners = (
  points: ControlPoint[],
  cornerRadius: number = DEFAULT_EDGE_ROUTING_CONFIG.cornerRadius
): string => {
  if (points.length < 2) {
    return '';
  }

  if (points.length === 2) {
    // Straight line
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }

  let path = `M ${points[0].x},${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Calculate vectors
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;

    // Calculate segment lengths
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    // Adjust corner radius if segments are too short
    const maxRadius = Math.min(cornerRadius, len1 / 2, len2 / 2);

    if (maxRadius > 0) {
      // Calculate points for the rounded corner
      const ratio1 = maxRadius / len1;
      const ratio2 = maxRadius / len2;

      const cornerStart = {
        x: curr.x - dx1 * ratio1,
        y: curr.y - dy1 * ratio1,
      };

      const cornerEnd = {
        x: curr.x + dx2 * ratio2,
        y: curr.y + dy2 * ratio2,
      };

      // Line to corner start, then quadratic curve to corner end
      path += ` L ${cornerStart.x},${cornerStart.y}`;
      path += ` Q ${curr.x},${curr.y} ${cornerEnd.x},${cornerEnd.y}`;
    } else {
      // Radius too small, just draw straight to corner
      path += ` L ${curr.x},${curr.y}`;
    }
  }

  // Final point
  const last = points[points.length - 1];
  path += ` L ${last.x},${last.y}`;

  return path;
};

export * from './types';
