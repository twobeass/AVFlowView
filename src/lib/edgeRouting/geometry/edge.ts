/**
 * Edge direction and line utilities
 */

import type { ControlPoint } from '../types';

/**
 * Check if two line segments are in the same direction
 */
export const areLinesSameDirection = (
  p1: ControlPoint,
  p2: ControlPoint,
  p3: ControlPoint,
  p4: ControlPoint
): boolean => {
  const dx1 = p2.x - p1.x;
  const dy1 = p2.y - p1.y;
  const dx2 = p4.x - p3.x;
  const dy2 = p4.y - p3.y;

  // Check if both horizontal or both vertical and in same direction
  if (dx1 === 0 && dx2 === 0) {
    // Both vertical
    return (dy1 > 0 && dy2 > 0) || (dy1 < 0 && dy2 < 0);
  }
  if (dy1 === 0 && dy2 === 0) {
    // Both horizontal
    return (dx1 > 0 && dx2 > 0) || (dx1 < 0 && dx2 < 0);
  }
  return false;
};

/**
 * Check if two line segments are in reverse directions (overlapping)
 */
export const areLinesReverseDirection = (
  p1: ControlPoint,
  p2: ControlPoint,
  p3: ControlPoint,
  p4: ControlPoint
): boolean => {
  const dx1 = p2.x - p1.x;
  const dy1 = p2.y - p1.y;
  const dx2 = p4.x - p3.x;
  const dy2 = p4.y - p3.y;

  // Check if both horizontal or both vertical but in opposite directions
  if (dx1 === 0 && dx2 === 0) {
    // Both vertical
    return (dy1 > 0 && dy2 < 0) || (dy1 < 0 && dy2 > 0);
  }
  if (dy1 === 0 && dy2 === 0) {
    // Both horizontal
    return (dx1 > 0 && dx2 < 0) || (dx1 < 0 && dx2 > 0);
  }
  return false;
};
