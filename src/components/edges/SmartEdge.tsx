import { BaseEdge, type EdgeProps, getBezierPath } from '@xyflow/react';

/**
 * Smart Edge Component with Rounded Corner Orthogonal Routing
 * 
 * Renders edges with intelligent orthogonal routing that:
 * - Uses ELK.js ORTHOGONAL routing for node avoidance
 * - Creates clean horizontal/vertical paths (no oblique segments)
 * - Smooths corners with rounded arcs for visual appeal
 * - Adds buffer zones (30px) around nodes to prevent crossings when nodes are moved
 * 
 * ROUTING STRATEGY:
 * 1. Uses ELK.js bendPoints as the basis for routing
 * 2. Detects collinear bendPoints (all on same line) and simplifies routing
 * 3. Filters out redundant intermediate points on straight segments
 * 4. Adds minimum 30px buffer segments at start and end for node movement tolerance
 * 
 * KNOWN ISSUES:
 * - Edges may still cross in complex graphs due to ELK's node placement
 * - Buffer zones help but don't completely eliminate crossings
 * - ELK's ORTHOGONAL routing doesn't guarantee zero crossings, just minimizes them
 * 
 * FUTURE IMPROVEMENTS:
 * - Consider post-processing to detect and fix remaining crossings
 * - Implement edge bundling for parallel edges
 * - Add custom A* pathfinding as fallback for problematic edges
 * - Adjust node placement algorithm to reduce crossings at source
 */

interface Point {
  x: number;
  y: number;
}

const CORNER_RADIUS = 14; // Radius for rounded corners
const MIN_SEGMENT_LENGTH = 30; // Minimum length for start/end segments

/**
 * Build orthogonal path with rounded corners
 */
function buildRoundedOrthogonalPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  controlPoints: Point[]
): string {
  if (controlPoints.length === 0) {
    // Direct line if no waypoints
    return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
  }

  // Build path with all waypoints
  const allPoints: Point[] = [
    { x: sourceX, y: sourceY },
    ...controlPoints,
    { x: targetX, y: targetY }
  ];

  let pathData = `M ${allPoints[0].x} ${allPoints[0].y}`;

  const EPSILON = 0.5; // Tolerance for floating-point comparison

  for (let i = 1; i < allPoints.length; i++) {
    const prev = allPoints[i - 1];
    const current = allPoints[i];
    const next = i < allPoints.length - 1 ? allPoints[i + 1] : null;

    if (next === null) {
      // Last segment - straight to target
      pathData += ` L ${current.x} ${current.y}`;
    } else {
      // Check if this is a corner (direction change)
      const dx1 = current.x - prev.x;
      const dy1 = current.y - prev.y;
      const dx2 = next.x - current.x;
      const dy2 = next.y - current.y;

      // Check if there's a direction change with tolerance for floating-point errors
      const isHorizontal1 = Math.abs(dy1) < EPSILON;
      const isVertical1 = Math.abs(dx1) < EPSILON;
      const isHorizontal2 = Math.abs(dy2) < EPSILON;
      const isVertical2 = Math.abs(dx2) < EPSILON;

      const isCorner = (isVertical1 && isHorizontal2) || (isHorizontal1 && isVertical2);

      if (isCorner) {
        // Calculate corner with rounded arc
        const segmentLength1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        const segmentLength2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        
        // Use smaller radius if segments are short
        const radius = Math.min(
          CORNER_RADIUS,
          segmentLength1 / 2,
          segmentLength2 / 2
        );

        if (radius > 1) {
          // Calculate approach point (before corner)
          const approach = {
            x: current.x - (dx1 / segmentLength1) * radius,
            y: current.y - (dy1 / segmentLength1) * radius
          };

          // Calculate exit point (after corner)
          const exit = {
            x: current.x + (dx2 / segmentLength2) * radius,
            y: current.y + (dy2 / segmentLength2) * radius
          };

          // Draw line to approach point, then arc to exit point
          pathData += ` L ${approach.x} ${approach.y}`;
          
          // Determine sweep direction based on turn direction
          // Cross product determines if turn is clockwise or counterclockwise
          const crossProduct = dx1 * dy2 - dy1 * dx2;
          const sweep = crossProduct > 0 ? 1 : 0;
          
          pathData += ` A ${radius} ${radius} 0 0 ${sweep} ${exit.x} ${exit.y}`;
        } else {
          // Radius too small, just draw straight line through corner
          pathData += ` L ${current.x} ${current.y}`;
        }
      } else {
        // Not a corner, straight line
        pathData += ` L ${current.x} ${current.y}`;
      }
    }
  }

  return pathData;
}

export default function SmartEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    style = {},
    markerEnd,
    data,
  } = props;
  
  // Use ELK routing data if available, otherwise use control points
  const elkPoints = (data?.elkPoints as Point[]) || [];
  const controlPoints = (data?.controlPoints as Point[]) || [];

  let pathData: string;

  if (elkPoints.length > 0) {
    // Use ELK's bendPoints, filtering out collinear points
    const elkBendPoints = elkPoints.slice(1, -1); // Only bendPoints, not start/end
    
    const waypoints: Point[] = [];
    
    if (elkBendPoints.length > 0) {
      // Check if all bendPoints are collinear (all same X or all same Y)
      const firstBend = elkBendPoints[0];
      const allSameX = elkBendPoints.every(p => Math.abs(p.x - firstBend.x) < 0.5);
      const allSameY = elkBendPoints.every(p => Math.abs(p.y - firstBend.y) < 0.5);
      
      if (allSameX || allSameY) {
        // All bendPoints are on a straight line - use simple routing with minimum segments
        const routingX = allSameX ? firstBend.x : (sourceX + targetX) / 2;
        const routingY = allSameY ? firstBend.y : (sourceY + targetY) / 2;
        
        if (allSameX) {
          // Vertical routing column - add buffer points
          const startBufferX = sourceX + (routingX > sourceX ? MIN_SEGMENT_LENGTH : -MIN_SEGMENT_LENGTH);
          const endBufferX = targetX + (routingX < targetX ? MIN_SEGMENT_LENGTH : -MIN_SEGMENT_LENGTH);
          
          waypoints.push({ x: startBufferX, y: sourceY });
          waypoints.push({ x: routingX, y: sourceY });
          waypoints.push({ x: routingX, y: targetY });
          waypoints.push({ x: endBufferX, y: targetY });
        } else {
          // Horizontal routing row - add buffer points
          const startBufferY = sourceY + (routingY > sourceY ? MIN_SEGMENT_LENGTH : -MIN_SEGMENT_LENGTH);
          const endBufferY = targetY + (routingY < targetY ? MIN_SEGMENT_LENGTH : -MIN_SEGMENT_LENGTH);
          
          waypoints.push({ x: sourceX, y: startBufferY });
          waypoints.push({ x: sourceX, y: routingY });
          waypoints.push({ x: targetX, y: routingY });
          waypoints.push({ x: targetX, y: endBufferY });
        }
      } else {
        // BendPoints form actual corners - filter out intermediate collinear points
        const filteredBends: Point[] = [elkBendPoints[0]]; // Always keep first
        
        for (let i = 1; i < elkBendPoints.length - 1; i++) {
          const prev = elkBendPoints[i - 1];
          const curr = elkBendPoints[i];
          const next = elkBendPoints[i + 1];
          
          // Check if this point is on the same line as prev and next
          const sameLine = 
            (Math.abs(curr.x - prev.x) < 0.5 && Math.abs(next.x - curr.x) < 0.5) ||
            (Math.abs(curr.y - prev.y) < 0.5 && Math.abs(next.y - curr.y) < 0.5);
          
          if (!sameLine) {
            filteredBends.push(curr);
          }
        }
        
        filteredBends.push(elkBendPoints[elkBendPoints.length - 1]); // Always keep last
        
        const firstBend = filteredBends[0];
        const lastBend = filteredBends[filteredBends.length - 1];
        
        // Add start buffer segment (minimum 30px from source)
        const startBufferX = sourceX + (firstBend.x > sourceX ? MIN_SEGMENT_LENGTH : -MIN_SEGMENT_LENGTH);
        waypoints.push({ x: startBufferX, y: sourceY });
        
        // Connect to first bendPoint
        waypoints.push({ x: firstBend.x, y: sourceY });
        
        // Add all filtered bendPoints
        waypoints.push(...filteredBends);
        
        // Connect from last bendPoint to end buffer
        waypoints.push({ x: lastBend.x, y: targetY });
        
        // Add end buffer segment (minimum 30px to target)
        const endBufferX = targetX + (lastBend.x < targetX ? MIN_SEGMENT_LENGTH : -MIN_SEGMENT_LENGTH);
        waypoints.push({ x: endBufferX, y: targetY });
      }
    } else {
      // No bendPoints - use midpoint with buffer segments
      const midX = (sourceX + targetX) / 2;
      const startBufferX = sourceX + (midX > sourceX ? MIN_SEGMENT_LENGTH : -MIN_SEGMENT_LENGTH);
      const endBufferX = targetX + (midX < targetX ? MIN_SEGMENT_LENGTH : -MIN_SEGMENT_LENGTH);
      
      waypoints.push({ x: startBufferX, y: sourceY });
      waypoints.push({ x: midX, y: sourceY });
      waypoints.push({ x: midX, y: targetY });
      waypoints.push({ x: endBufferX, y: targetY });
    }
    
    pathData = buildRoundedOrthogonalPath(
      sourceX,
      sourceY,
      targetX,
      targetY,
      waypoints
    );
  } else if (controlPoints.length > 0) {
    // Build orthogonal path with rounded corners from control points
    pathData = buildRoundedOrthogonalPath(
      sourceX,
      sourceY,
      targetX,
      targetY,
      controlPoints
    );
  } else {
    // Use default bezier path when no routing data
    [pathData] = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    });
  }

  const edgeStyle = {
    ...style,
    strokeWidth: style.strokeWidth || 2.5,
    fill: 'none', // Ensure path is not filled
  };

  return (
    <BaseEdge path={pathData} style={edgeStyle} markerEnd={markerEnd} />
  );
}
