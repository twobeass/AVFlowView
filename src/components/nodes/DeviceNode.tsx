import React from 'react';
import { Handle, Position } from '@xyflow/react';

const portAlignmentToPosition = {
  In: Position.Left,
  Out: Position.Right,
  Bidirectional: Position.Right, // smarter default (optional: make dynamic)
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
        maxWidth: 190, // allow longer text
        padding: 10,
        boxSizing: 'border-box',
        fontSize: 15,
        boxShadow: '2px 2px 7px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 5
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 17, lineHeight: 1.16 }}>{data.label || data.model}</div>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>{data.manufacturer}</div>
      <div style={{ width: '100%', borderTop: '1px solid #ccc', paddingTop: 6, marginTop: 2, wordBreak: 'break-word', paddingBottom: 6 }}>
        {ports.map(([key, port]) => (
          <div key={key} style={{ fontSize: 12, marginBottom: 4, position: 'relative', paddingRight: 12 }}>
            {port.label} ({port.type})
            <Handle
              type={port.alignment === "In" ? "target" : "source"}
              id={key}
              position={portAlignmentToPosition[port.alignment] || Position.Right}
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
