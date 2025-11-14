/**
 * ElkEdge component that respects ELK's orthogonal routing
 * Uses ELK's calculated bend points for proper edge separation
 */

import { BaseEdge, EdgeLabelRenderer, EdgeProps } from '@xyflow/react';
import { useMemo } from 'react';

export interface ElkEdgeProps extends EdgeProps {
  data?: {
    elkSections?: any[];
  };
}

export default function ElkEdge(props: ElkEdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    style = {},
    markerEnd,
    label,
    data,
  } = props;

  // Generate path from ELK routing sections or fallback to simple line
  const { path, labelX, labelY } = useMemo(() => {
    // Check if we have ELK routing sections
    if (data?.elkSections && data.elkSections.length > 0) {
      const section = data.elkSections[0];
      
      // ELK provides bendPoints for orthogonal routing
      if (section.bendPoints && section.bendPoints.length > 0) {
        // Start from ReactFlow's source position (actual handle position)
        let pathStr = `M ${sourceX},${sourceY}`;
        
        // Add all bend points
        section.bendPoints.forEach((point: any) => {
          pathStr += ` L ${point.x},${point.y}`;
        });
        
        // End at ReactFlow's target position (actual handle position)
        pathStr += ` L ${targetX},${targetY}`;
        
        // Calculate label position (middle of path)
        const midIndex = Math.floor(section.bendPoints.length / 2);
        const labelPoint = section.bendPoints[midIndex] || { x: sourceX, y: sourceY };
        
        return {
          path: pathStr,
          labelX: labelPoint.x,
          labelY: labelPoint.y,
        };
      }
      
      // If no bend points but have section points, still use ReactFlow coordinates
      if (section.startPoint && section.endPoint) {
        // Use a simple path with one intermediate point if available
        return {
          path: `M ${sourceX},${sourceY} L ${targetX},${targetY}`,
          labelX: (sourceX + targetX) / 2,
          labelY: (sourceY + targetY) / 2,
        };
      }
    }
    
    // Fallback to simple straight line using ReactFlow's provided coordinates
    return {
      path: `M ${sourceX},${sourceY} L ${targetX},${targetY}`,
      labelX: (sourceX + targetX) / 2,
      labelY: (sourceY + targetY) / 2,
    };
  }, [data, sourceX, sourceY, targetX, targetY]);

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
              background: '#ffffff',
              border: '1px solid #ccc',
              fontSize: '10px',
              padding: '2px 4px',
              borderRadius: '2px',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
