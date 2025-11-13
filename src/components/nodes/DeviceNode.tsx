import React from 'react';
import { Handle, Position } from '@xyflow/react';

const portAlignmentToPosition = {
  In: Position.Left,
  Out: Position.Right,
  Bidirectional: Position.Bottom
};

export default function DeviceNode({ id, data }) {
  const ports = data.ports ? Object.entries(data.ports) : [];
  return (
    <div style={{ background: '#e3e3f3', padding: 16, borderRadius: 4, border: '2px solid #777' }}>
      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{data.label || data.model}</div>
      <div style={{ fontSize: 10, marginBottom: 2 }}>{data.manufacturer}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {ports.map(([key, port]) =>
          <div key={key} style={{ fontSize: 11 }}>{port.label} ({port.type})</div>
        )}
      </div>
      {ports.map(([key, port]) =>
        <Handle
          key={key}
          type={port.alignment === "In" ? "target" : "source"}
          id={key}
          position={portAlignmentToPosition[port.alignment] || Position.Bottom}
          style={{ background: port.alignment === "In" ? "#1976d2" : "#43a047", width: 10, height: 10 }}
        />
      )}
    </div>
  );
}
