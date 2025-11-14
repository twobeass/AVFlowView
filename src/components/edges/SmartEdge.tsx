/**
 * SmartEdge component with intelligent routing
 * Uses A* pathfinding to avoid node collisions
 */

import { BaseEdge, EdgeLabelRenderer, EdgeProps, useInternalNode, useStore } from '@xyflow/react';
import { useMemo } from 'react';
import { getControlPoints, generatePathWithRoundedCorners } from '../../lib/edgeRouting';
import type { HandlePositionType, NodeRect } from '../../lib/edgeRouting';

export interface SmartEdgeProps extends EdgeProps {
  // Add any custom props here
}

/**
 * Determine handle position based on source/target position
 */
const getHandlePosition = (position?: string): HandlePositionType => {
  switch (position) {
    case 'top':
      return 'top';
    case 'bottom':
      return 'bottom';
    case 'left':
      return 'left';
    case 'right':
      return 'right';
    default:
      return 'right';
  }
};

export default function SmartEdge(props: SmartEdgeProps) {
  const {
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    label,
    labelStyle,
    labelShowBg,
    labelBgStyle,
    labelBgPadding,
    labelBgBorderRadius,
  } = props;

  // Get source and target nodes for collision detection
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  // Calculate the smart path
  const { path, labelX, labelY } = useMemo(() => {
    if (!sourceNode || !targetNode) {
      // Fallback to simple straight line if nodes not found
      console.warn(`SmartEdge ${id}: Nodes not found (source: ${!!sourceNode}, target: ${!!targetNode})`);
      return {
        path: `M ${sourceX},${sourceY} L ${targetX},${targetY}`,
        labelX: (sourceX + targetX) / 2,
        labelY: (sourceY + targetY) / 2,
      };
    }

    // Wait for node dimensions to be measured
    if (!sourceNode.measured || !targetNode.measured) {
      console.warn(`SmartEdge ${id}: Nodes not measured yet (source: ${sourceNode.measured}, target: ${targetNode.measured})`);
      return {
        path: `M ${sourceX},${sourceY} L ${targetX},${targetY}`,
        labelX: (sourceX + targetX) / 2,
        labelY: (sourceY + targetY) / 2,
      };
    }

    try {
      // Calculate control points using smart routing
      const { points } = getControlPoints({
        source: {
          x: sourceX,
          y: sourceY,
          position: getHandlePosition(sourcePosition),
        },
        target: {
          x: targetX,
          y: targetY,
          position: getHandlePosition(targetPosition),
        },
        sourceRect: {
          x: sourceNode.position.x,
          y: sourceNode.position.y,
          width: sourceNode.measured.width ?? sourceNode.width ?? 280,
          height: sourceNode.measured.height ?? sourceNode.height ?? 100,
        },
        targetRect: {
          x: targetNode.position.x,
          y: targetNode.position.y,
          width: targetNode.measured.width ?? targetNode.width ?? 280,
          height: targetNode.measured.height ?? targetNode.height ?? 100,
        },
        offset: 20,
      });

      // Generate SVG path with rounded corners
      const svgPath = generatePathWithRoundedCorners(points, 8);

      // Calculate label position (middle of path)
      const midPoint = points[Math.floor(points.length / 2)];
      
      return {
        path: svgPath,
        labelX: midPoint.x,
        labelY: midPoint.y,
      };
    } catch (error) {
      console.error(`SmartEdge ${id}: Error calculating path:`, error);
      // Fallback to simple line
      return {
        path: `M ${sourceX},${sourceY} L ${targetX},${targetY}`,
        labelX: (sourceX + targetX) / 2,
        labelY: (sourceY + targetY) / 2,
      };
    }
  }, [id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, sourceNode, targetNode]);

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={style}
        markerEnd={markerEnd}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              ...labelStyle,
            }}
            className="nodrag nopan"
          >
            {labelShowBg !== false ? (
              <div
                style={{
                  padding: typeof labelBgPadding === 'number' ? labelBgPadding : 2,
                  borderRadius: typeof labelBgBorderRadius === 'number' ? labelBgBorderRadius : 2,
                  background: '#ffffff',
                  border: '1px solid #ccc',
                  fontSize: '10px',
                  ...labelBgStyle,
                }}
              >
                {label}
              </div>
            ) : (
              <div style={{ fontSize: '10px' }}>{label}</div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
