import { Handle, Position } from '@xyflow/react';
import { categoryColors, portAlignmentColors, textColors } from '../../config/colors';

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

function getCategoryStyles(category: string) {
  return categoryColors[category as keyof typeof categoryColors] || categoryColors.Default;
}

export default function DeviceNode({ id: _id, data }: any) {
  // safeguard: No data or no ports? Render fallback
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
  
  // Separate ports by their computed position (left vs right)
  const leftPorts: any[] = [];
  const rightPorts: any[] = [];
  
  ports.forEach(([key, port]: any) => {
    if (port.alignment === 'In') {
      leftPorts.push([key, port, 'target']);
    } else if (port.alignment === 'Out') {
      rightPorts.push([key, port, 'source']);
    } else if (port.alignment === 'Bidirectional') {
      // Use computed side to determine placement
      const elkPos = elkSideToPosition(port.computedSide);
      if (elkPos === Position.Left) {
        leftPorts.push([key, port, 'bidirectional']);
      } else {
        rightPorts.push([key, port, 'bidirectional']);
      }
    }
  });

  return (
    <div
      style={{
        background: categoryStyles.background,
        border: `2px solid ${categoryStyles.border}`,
        borderRadius: 8,
        minWidth: 400,
        maxWidth: 500,
        padding: 12,
        boxSizing: 'border-box',
        fontSize: 14,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {/* Device header */}
      <div style={{ 
        fontWeight: 600, 
        fontSize: 16, 
        lineHeight: 1.2, 
        color: '#212121',
        marginBottom: 2,
      }}>
        {data.label || data.model}
      </div>
      
      {/* Manufacturer info */}
      <div style={{ 
        fontSize: 13, 
        color: '#666',
        marginBottom: 4,
      }}>
        {data.manufacturer}
      </div>
      
      {/* Ports section */}
      <div style={{ 
        width: '100%', 
        borderTop: `1px solid ${categoryStyles.accent}40`,
        paddingTop: 8, 
        marginTop: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        {/* All ports in two columns based on position */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
        }}>
          {/* Left column */}
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            paddingLeft: '12px',
          }}>
            {leftPorts.map(([key, port, handleType]: any) => {
              const isBidirectional = handleType === 'bidirectional';
              const handleColor = isBidirectional ? portAlignmentColors.Bidirectional : portAlignmentColors.In;
              
              return (
                <div 
                  key={key} 
                  style={{ 
                    fontSize: 12,
                    position: 'relative',
                    color: textColors.tertiary,
                    lineHeight: 1.4,
                    textAlign: 'left',
                  }}
                >
                  {port.label} ({port.type})
                  {isBidirectional ? (
                    <>
                      <Handle
                        type="target"
                        id={key}
                        position={Position.Left}
                        style={{
                          background: handleColor,
                          border: '2px solid white',
                          width: 12,
                          height: 12,
                          transition: 'all 0.2s ease-in-out',
                          left: '-20px',
                        }}
                      />
                      <Handle
                        type="source"
                        id={key}
                        position={Position.Left}
                        style={{
                          background: handleColor,
                          border: '2px solid white',
                          width: 12,
                          height: 12,
                          transition: 'all 0.2s ease-in-out',
                          left: '-20px',
                        }}
                      />
                    </>
                  ) : (
                    <Handle
                      type="target"
                      id={key}
                      position={Position.Left}
                      style={{
                        background: handleColor,
                        border: '2px solid white',
                        width: 12,
                        height: 12,
                        transition: 'all 0.2s ease-in-out',
                        left: '-20px',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Right column */}
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            paddingRight: '12px',
            alignItems: 'flex-end',
          }}>
            {rightPorts.map(([key, port, handleType]: any) => {
              const isBidirectional = handleType === 'bidirectional';
              const handleColor = isBidirectional ? portAlignmentColors.Bidirectional : portAlignmentColors.Out;
              
              return (
                <div 
                  key={key} 
                  style={{ 
                    fontSize: 12,
                    position: 'relative',
                    color: textColors.tertiary,
                    lineHeight: 1.4,
                    textAlign: 'right',
                  }}
                >
                  {port.label} ({port.type})
                  {isBidirectional ? (
                    <>
                      <Handle
                        type="target"
                        id={key}
                        position={Position.Right}
                        style={{
                          background: handleColor,
                          border: '2px solid white',
                          width: 12,
                          height: 12,
                          transition: 'all 0.2s ease-in-out',
                          right: '-20px',
                        }}
                      />
                      <Handle
                        type="source"
                        id={key}
                        position={Position.Right}
                        style={{
                          background: handleColor,
                          border: '2px solid white',
                          width: 12,
                          height: 12,
                          transition: 'all 0.2s ease-in-out',
                          right: '-20px',
                        }}
                      />
                    </>
                  ) : (
                    <Handle
                      type="source"
                      id={key}
                      position={Position.Right}
                      style={{
                        background: handleColor,
                        border: '2px solid white',
                        width: 12,
                        height: 12,
                        transition: 'all 0.2s ease-in-out',
                        right: '-20px',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
