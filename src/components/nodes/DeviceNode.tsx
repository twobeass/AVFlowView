import { Handle, Position } from '@xyflow/react';
import { categoryColors, textColors } from '../../config/colors';

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
        minWidth: 400,
      }}>
        (unknown device)
      </div>
    );
  }

  const categoryStyles = getCategoryStyles(data.category);
  
  // Simplified mode: show only label with category color
  if (data.simplifiedMode) {
    return (
      <div
        style={{
          background: categoryStyles.background,
          border: `2px solid ${categoryStyles.border}`,
          borderRadius: 8,
          width: 200,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12,
          boxSizing: 'border-box',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          position: 'relative',
        }}
      >
        {/* Invisible handles for edge connections */}
        <Handle
          type="target"
          position={Position.Left}
          style={{ opacity: 0 }}
        />
        <Handle
          type="source"
          position={Position.Right}
          style={{ opacity: 0 }}
        />
        
        <div style={{ 
          fontWeight: 600, 
          fontSize: 14,
          color: textColors.primary,
          textAlign: 'center',
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
        }}>
          {data.label || data.model}
        </div>
      </div>
    );
  }
  
  // Detailed mode: show full node with ports
  const ports = Object.entries(data.ports);

  // Separate ports by alignment
  const inputPorts = ports.filter(([_, port]: any) => port.alignment === 'In');
  const outputPorts = ports.filter(([_, port]: any) => port.alignment === 'Out');
  const bidirectionalPorts = ports.filter(([_, port]: any) => port.alignment === 'Bidirectional');

  return (
    <div
      style={{
        background: categoryStyles.background,
        border: `2px solid ${categoryStyles.border}`,
        borderRadius: 8,
        minWidth: 400,
        maxWidth: 500,
        padding: 0,
        boxSizing: 'border-box',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      }}
    >
      {/* Header Section */}
      <div style={{ 
        padding: '12px 12px 8px 12px',
      }}>
        <div style={{ 
          fontWeight: 600, 
          fontSize: 16,
          color: textColors.primary,
          marginBottom: 4,
          lineHeight: 1.2,
        }}>
          {data.label || data.model}
        </div>
        <div style={{ 
          fontSize: 13, 
          color: textColors.secondary,
        }}>
          {data.manufacturer}
        </div>
      </div>

      {/* Divider */}
      <div style={{ 
        borderTop: `1px solid ${categoryStyles.border}`,
        opacity: 0.3,
      }} />

      {/* Ports Section */}
      <div style={{ 
        padding: '12px 0',
      }}>
        {/* Side-by-Side Grid for Inputs and Outputs */}
        {(inputPorts.length > 0 || outputPorts.length > 0) && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: bidirectionalPorts.length > 0 ? 8 : 0,
          }}>
            {/* Left Column - Inputs */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}>
              {inputPorts.map(([key, port]: any) => (
                <div key={key} style={{ 
                  fontSize: 12,
                  color: textColors.tertiary,
                  position: 'relative',
                  paddingLeft: 12,
                  textAlign: 'left',
                }}>
                  {port.label} ({port.type})
                  <Handle
                    type="target"
                    id={key}
                    position={Position.Left}
                    style={{
                      background: '#1976D2',
                      width: 12,
                      height: 12,
                      border: '2px solid #fff',
                      left: 0,
                      transition: 'all 0.2s ease-in-out',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Right Column - Outputs */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              alignItems: 'flex-end',
            }}>
              {outputPorts.map(([key, port]: any) => (
                <div key={key} style={{ 
                  fontSize: 12,
                  color: textColors.tertiary,
                  position: 'relative',
                  paddingRight: 12,
                  textAlign: 'right',
                }}>
                  {port.label} ({port.type})
                  <Handle
                    type="source"
                    id={key}
                    position={Position.Right}
                    style={{
                      background: '#43A047',
                      width: 12,
                      height: 12,
                      border: '2px solid #fff',
                      right: 0,
                      transition: 'all 0.2s ease-in-out',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bidirectional Ports - Below Grid */}
        {bidirectionalPorts.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            paddingLeft: 12,
          }}>
            {bidirectionalPorts.map(([key, port]: any) => {
              // Determine side based on port properties or default to right
              const computedSide = (port as any).computedSide || 'right';
              const position = computedSide === 'left' ? Position.Left : Position.Right;
              const isLeft = position === Position.Left;
              
              return (
                <div key={key} style={{ 
                  fontSize: 12,
                  color: textColors.tertiary,
                  position: 'relative',
                  paddingLeft: isLeft ? 12 : 0,
                  paddingRight: isLeft ? 0 : 12,
                  textAlign: isLeft ? 'left' : 'right',
                }}>
                  {port.label} ({port.type})
                  <Handle
                    type="source"
                    id={key}
                    position={position}
                    style={{
                      background: '#F57C00',
                      width: 12,
                      height: 12,
                      border: '2px solid #fff',
                      left: isLeft ? 0 : undefined,
                      right: isLeft ? undefined : 0,
                      transition: 'all 0.2s ease-in-out',
                    }}
                  />
                  <Handle
                    type="target"
                    id={key}
                    position={position}
                    style={{
                      background: '#F57C00',
                      width: 12,
                      height: 12,
                      border: '2px solid #fff',
                      left: isLeft ? 0 : undefined,
                      right: isLeft ? undefined : 0,
                      transition: 'all 0.2s ease-in-out',
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
