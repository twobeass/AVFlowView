import React from 'react';

export default function GroupNode({ id, data }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#eef4fb',
        border: '2px dashed #bbb',
        borderRadius: 14,
        opacity: 0.42,
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 4,
          left: 12,
          fontSize: 14,
          fontWeight: 600,
          color: '#333',
          opacity: 1,
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '2px 8px',
          borderRadius: 4,
        }}
      >
        {data.label || id}
      </div>
    </div>
  );
}
