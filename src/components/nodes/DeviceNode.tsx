import { Handle, Position } from '@xyflow/react';

const portAlignmentToPosition = {
  In: Position.Left,
  Out: Position.Right,
  Bidirectional: Position.Right, // smarter default (optional: make dynamic)
};

function elkSideToPosition(side: any) {
  if (!side) return undefined;
  switch (side) {
    case 'NORTH': return Position.Top;
    case 'SOUTH': return Position.Bottom;
    case 'EAST': return Position.Right;
    case 'WEST': return Position.Left;
    default: return undefined;
  }
}

export default function DeviceNode({ id: _id, data }: any) {
  // safeguard: No data or no ports? Render fallback
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
        {ports.map(([key, port]: any) => {
          // Prefer ELK-computed side when available (port.computedSide)
          const elkPos = elkSideToPosition(((port as any) && (port as any).computedSide) || undefined);
          const position = elkPos || (portAlignmentToPosition as any)[(port as any).alignment] || Position.Right;
          const handleType = (port as any).alignment === "In" ? "target" : "source";
          return (
            <div key={key} style={{ fontSize: 12, marginBottom: 4, position: 'relative', paddingRight: 12 }}>
              {(port as any).label} ({(port as any).type})
              <Handle
                type={handleType}
                id={key}
                position={position}
                style={{
                  background: (port as any).alignment === "In" ? "#1976d2" : "#43a047",
                  width: 10,
                  height: 10,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
