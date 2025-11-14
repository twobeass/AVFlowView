import { Handle, Position } from '@xyflow/react';
import { categoryColors, portAlignmentColors } from '../../config/colors';

const portAlignmentToPosition = {
  In: Position.Left,
  Out: Position.Right,
  Bidirectional: Position.Right,
};

function getCategoryStyles(category: string) {
  return categoryColors[category as keyof typeof categoryColors] || categoryColors.Default;
}

export default function DeviceNode({ id: _id, data }: any) {
  if (!data || !data.ports) {
    return (
      <div style={{
        background: '#F5F5F5',
        border: '2px solid #ccc',
        borderRadius: 8,
        color: '#666',
        padding: 12,
        fontSize: 13,
      }}>
        (unknown device)
      </div>
    );
  }

  const categoryStyles = getCategoryStyles(data.category);
  const ports = Object.entries(data.ports);

  return (
    <div
      style={{
        background: categoryStyles.background,
        border: `2px solid ${categoryStyles.border}`,
        borderRadius: 8,
        minWidth: 280,
        padding: 12,
        boxSizing: 'border-box',
        fontSize: 14,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      }}
    >
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: 4, 
        fontSize: 17, 
        lineHeight: 1.16 
      }}>
        {data.label || data.model}
      </div>
      <div style={{ 
        fontSize: 13, 
        color: '#666', 
        marginBottom: 4 
      }}>
        {data.manufacturer}
      </div>
      <div style={{ 
        width: '100%', 
        borderTop: '1px solid #ccc', 
        paddingTop: 6, 
        marginTop: 2, 
        wordBreak: 'break-word', 
        paddingBottom: 6 
      }}>
        {ports.map(([key, port]: any) => {
          const position = (portAlignmentToPosition as any)[port.alignment] || Position.Right;
          const handleColor = (portAlignmentColors as any)[port.alignment] || portAlignmentColors.Out;
          const isBidirectional = port.alignment === "Bidirectional";
          
          return (
            <div key={key} style={{ 
              fontSize: 12, 
              marginBottom: 4, 
              position: 'relative', 
              paddingRight: 12 
            }}>
              {port.label} ({port.type})
              {isBidirectional ? (
                <>
                  <Handle
                    type="source"
                    id={key}
                    position={position}
                    style={{
                      background: handleColor,
                      width: 10,
                      height: 10,
                    }}
                  />
                  <Handle
                    type="target"
                    id={key}
                    position={position}
                    style={{
                      background: handleColor,
                      width: 10,
                      height: 10,
                    }}
                  />
                </>
              ) : (
                <Handle
                  type={port.alignment === "In" ? "target" : "source"}
                  id={key}
                  position={position}
                  style={{
                    background: handleColor,
                    width: 10,
                    height: 10,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
