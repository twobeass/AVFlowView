/**
 * OffsetSmoothStepEdge - Smoothstep edge with vertical offset support
 * Applies perpendicular offset to separate parallel edges
 */

import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from '@xyflow/react';

export interface OffsetSmoothStepEdgeProps extends EdgeProps {
  data?: {
    offset?: number;
  };
}

export default function OffsetSmoothStepEdge(props: OffsetSmoothStepEdgeProps) {
  const {
    id,
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
    data,
  } = props;

  const offset = data?.offset || 0;

  // Apply perpendicular offset based on edge direction
  // For horizontal layouts (LR), offset vertically
  const isHorizontal = Math.abs(targetX - sourceX) > Math.abs(targetY - sourceY);
  
  let adjustedSourceX = sourceX;
  let adjustedSourceY = sourceY;
  let adjustedTargetX = targetX;
  let adjustedTargetY = targetY;
  
  if (isHorizontal) {
    // Horizontal edge - apply vertical offset
    adjustedSourceY += offset;
    adjustedTargetY += offset;
  } else {
    // Vertical edge - apply horizontal offset
    adjustedSourceX += offset;
    adjustedTargetX += offset;
  }

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX: adjustedSourceX,
    sourceY: adjustedSourceY,
    sourcePosition,
    targetX: adjustedTargetX,
    targetY: adjustedTargetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
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
