interface FocusModePanelProps {
  enabled: boolean;
  focusedNodeId: string | null;
  focusedNodeLabel: string | null;
  depthOutgoing: number;
  depthIncoming: number;
  followOutgoing: boolean;
  followIncoming: boolean;
  visibleNodeCount: number;
  totalNodeCount: number;
  onDepthOutgoingChange: (depth: number) => void;
  onDepthIncomingChange: (depth: number) => void;
  onFollowOutgoingChange: (follow: boolean) => void;
  onFollowIncomingChange: (follow: boolean) => void;
  onExitFocus: () => void;
}

export default function FocusModePanel({
  enabled,
  focusedNodeId: _focusedNodeId,
  focusedNodeLabel,
  depthOutgoing,
  depthIncoming,
  followOutgoing,
  followIncoming,
  visibleNodeCount,
  totalNodeCount,
  onDepthOutgoingChange,
  onDepthIncomingChange,
  onFollowOutgoingChange,
  onFollowIncomingChange,
  onExitFocus,
}: FocusModePanelProps) {
  // Only render when enabled
  if (!enabled) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: 280,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e0e0e0',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        padding: 16,
        boxSizing: 'border-box',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(-100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      {/* Header */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: '#212121',
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        Focus Mode
      </div>

      {/* Status */}
      <div
        style={{
          fontSize: 13,
          color: enabled ? '#1976d2' : '#999',
          marginBottom: 12,
          padding: 8,
          backgroundColor: enabled ? '#e3f2fd' : '#f5f5f5',
          borderRadius: 4,
          borderLeft: `3px solid ${enabled ? '#1976d2' : '#ccc'}`,
        }}
      >
        <div style={{ fontWeight: 600 }}>
          {enabled ? `Active` : `Inactive`}
        </div>
        {enabled && focusedNodeLabel && (
          <div style={{ fontSize: 12, marginTop: 4, color: '#666' }}>
            Node: {focusedNodeLabel}
          </div>
        )}
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          backgroundColor: '#e0e0e0',
          marginBottom: 12,
        }}
      />

      {/* Outgoing K-Depth Control */}
      {followOutgoing && (
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 600,
              color: '#212121',
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
            }}
          >
            Outgoing Depth: <span style={{ fontWeight: 700, fontSize: 14 }}>{depthOutgoing}</span>
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={depthOutgoing}
            onChange={(e) => onDepthOutgoingChange(parseInt(e.target.value))}
            style={{
              width: '100%',
              height: 6,
              borderRadius: 3,
              backgroundColor: '#e0e0e0',
              outline: 'none',
              WebkitAppearance: 'none',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: '#999',
              marginTop: 4,
            }}
          >
            <span>1 hop</span>
            <span>5 hops</span>
          </div>
        </div>
      )}

      {/* Incoming K-Depth Control */}
      {followIncoming && (
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 600,
              color: '#212121',
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
            }}
          >
            Incoming Depth: <span style={{ fontWeight: 700, fontSize: 14 }}>{depthIncoming}</span>
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={depthIncoming}
            onChange={(e) => onDepthIncomingChange(parseInt(e.target.value))}
            style={{
              width: '100%',
              height: 6,
              borderRadius: 3,
              backgroundColor: '#e0e0e0',
              outline: 'none',
              WebkitAppearance: 'none',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: '#999',
              marginTop: 4,
            }}
          >
            <span>1 hop</span>
            <span>5 hops</span>
          </div>
        </div>
      )}

      {/* Direction Controls */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#212121',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          }}
        >
          Edge Direction
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: '#333',
            marginBottom: 8,
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={followOutgoing}
            onChange={(e) => onFollowOutgoingChange(e.target.checked)}
            style={{
              width: 16,
              height: 16,
              cursor: 'pointer',
            }}
          />
          Follow Outgoing
        </label>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: '#333',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={followIncoming}
            onChange={(e) => onFollowIncomingChange(e.target.checked)}
            style={{
              width: 16,
              height: 16,
              cursor: 'pointer',
            }}
          />
          Follow Incoming
        </label>
      </div>

      {/* Node Count */}
      <div
        style={{
          fontSize: 12,
          color: '#666',
          backgroundColor: '#f5f5f5',
          padding: 8,
          borderRadius: 4,
          marginBottom: 12,
        }}
      >
        <strong>{visibleNodeCount}</strong> of <strong>{totalNodeCount}</strong> nodes visible
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          backgroundColor: '#e0e0e0',
          marginBottom: 12,
        }}
      />

      {/* Exit Button */}
      <button
        onClick={onExitFocus}
        style={{
          padding: '10px 12px',
          backgroundColor: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor = '#d32f2f';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor = '#f44336';
        }}
      >
        Exit Focus Mode
      </button>
    </div>
  );
}
