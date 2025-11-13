import React from 'react';
import { Handle, Position } from '@xyflow/react';

const portAlignmentToPosition = {
  In: Position.Left,
  Out: Position.Right,
  Bidirectional: Position.Bottom,
};

export default function DeviceNode({ id, data }) {
  // safeguard: No data or no ports? Render fallback (prevents crash on area bounding boxes or corrupt nodes)
  if (!data || !data.ports) {
    return (
      <div style={{
        background: '#edeafd88',
        border: '2px solid #ccc',
        borderRadius: 8,
        color: '#3339',
        padding: 8
      }}>
        (unknown or aggregate)
      </div>
    );
  }

  const ports = Object.entries(data.ports);
  return (
    <div
      style={{
        background: '#edeafd',
        border: '2px solid #888',
        borderRadius: 6,
        minWidth: 120,
        maxWidth: 160,
        padding: 8,
        boxSizing: 'border-box',
        fontSize: 13,
        boxShadow: '2px 2px 7px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: 2 }}>{data.label || data.model}</div>
      <div style={{ fontSize: 10, color: '#666' }}>{data.manufacturer}</div>
      <div style={{ width: '100%', borderTop: '1px solid #ccc', paddingTop: 4, marginTop: 2 }}>
        {ports.map(([key, port]) => (
          <div key={key} style={{ fontSize: 11, marginBottom: 2, position: 'relative' }}>
            {port.label} ({port.type})
            <Handle
              type={port.alignment === "In" ? "target" : "source"}
              id={key}
              position={portAlignmentToPosition[port.alignment] || Position.Bottom}
              style={{
                background: port.alignment === "In" ? "#1976d2" : "#43a047",
                width: 10,
                height: 10,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
