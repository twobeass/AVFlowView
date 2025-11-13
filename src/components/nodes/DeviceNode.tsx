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
  
  // Separate ports by type
  const inputPorts = ports.filter(([_, port]: any) => port.alignment === 'In');
  const outputPorts = ports.filter(([_, port]: any) => port.alignment === 'Out');
  const biPorts = ports.filter(([_, port]: any) => port.alignment === 'Bidirectional');

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
        {/* Input/Output ports side-by-side */}
        {(inputPorts.length > 0 || outputPorts.length > 0) && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}>
            {/* Left column - Inputs */}
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              paddingLeft: '12px',
            }}>
              {inputPorts.map(([key, port]: any) => (
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
                  <Handle
                    type="target"
                    id={key}
                    position={Position.Left}
                    style={{
                      background: portAlignmentColors.In,
                      border: '2px solid white',
                      width: 12,
                      height: 12,
                      transition: 'all 0.2s ease-in-out',
                      left: '-20px',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Right column - Outputs */}
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              paddingRight: '12px',
              alignItems: 'flex-end',
            }}>
              {outputPorts.map(([key, port]: any) => (
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
                  <Handle
                    type="source"
                    id={key}
                    position={Position.Right}
                    style={{
                      background: portAlignmentColors.Out,
                      border: '2px solid white',
                      width: 12,
                      height: 12,
                      transition: 'all 0.2s ease-in-out',
                      right: '-20px',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bidirectional ports - positioned based on computed side */}
        {biPorts.length > 0 && (
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            marginTop: 4,
          }}>
            {biPorts.map(([key, port]: any) => {
              const elkPos = elkSideToPosition(port.computedSide);
              const position = elkPos || Position.Right;
              const isLeft = position === Position.Left;
              const handleColor = portAlignmentColors.Bidirectional;
              
              return (
                <div 
                  key={key} 
                  style={{ 
                    fontSize: 12,
                    position: 'relative',
                    color: textColors.tertiary,
                    lineHeight: 1.4,
                    textAlign: isLeft ? 'left' : 'right',
                    paddingLeft: isLeft ? '12px' : '0',
                    paddingRight: isLeft ? '0' : '12px',
                  }}
                >
                  {port.label} ({port.type})
                  <Handle
                    type="source"
                    id={key}
                    position={position}
                    style={{
                      background: handleColor,
                      border: '2px solid white',
                      width: 12,
                      height: 12,
                      transition: 'all 0.2s ease-in-out',
                      left: position === Position.Left ? '-20px' : undefined,
                      right: position === Position.Right ? '-20px' : undefined,
                      top: position === Position.Top ? '-20px' : undefined,
                      bottom: position === Position.Bottom ? '-20px' : undefined,
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
