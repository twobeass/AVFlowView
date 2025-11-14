/**
 * Simple path algorithm for direct connections
 * Used when nodes are too close or can be directly connected
 */

import type { ControlPoint, HandlePosition } from '../types';

interface GetSimplePathParams {
  source: HandlePosition;
  target: HandlePosition;
  sourceOffset: ControlPoint;
  targetOffset: ControlPoint;
  isDirectConnect: boolean;
}

/**
 * Generate a simple path between two points
 * Uses a single bend point when necessary
 */
export const getSimplePath = ({
  source,
  target,
  sourceOffset,
  targetOffset,
  isDirectConnect,
}: GetSimplePathParams): ControlPoint[] => {
  if (isDirectConnect) {
    // Direct connection - no intermediate points needed
    return [sourceOffset, targetOffset];
  }

  // Create a simple L-shaped or Z-shaped path
  const sourcePos = source.position;
  const targetPos = target.position;

  // Determine if we need one or two bend points
  if (sourcePos === 'left' || sourcePos === 'right') {
    // Horizontal source
    if (targetPos === 'left' || targetPos === 'right') {
      // Horizontal target - use vertical center line
      const midY = (sourceOffset.y + targetOffset.y) / 2;
      return [
        sourceOffset,
        { x: sourceOffset.x, y: midY },
        { x: targetOffset.x, y: midY },
        targetOffset,
      ];
    } else {
      // Vertical target - single bend
      return [
        sourceOffset,
        { x: sourceOffset.x, y: targetOffset.y },
        targetOffset,
      ];
    }
  } else {
    // Vertical source
    if (targetPos === 'top' || targetPos === 'bottom') {
      // Vertical target - use horizontal center line
      const midX = (sourceOffset.x + targetOffset.x) / 2;
      return [
        sourceOffset,
        { x: midX, y: sourceOffset.y },
        { x: midX, y: targetOffset.y },
        targetOffset,
      ];
    } else {
      // Horizontal target - single bend
      return [
        sourceOffset,
        { x: targetOffset.x, y: sourceOffset.y },
        targetOffset,
      ];
    }
  }
};
