import { areaColors } from '../../config/colors';

export default function GroupNode({ id, data }: any) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: areaColors.background,
        border: `2px dashed ${areaColors.border}`,
        borderRadius: 12,
        position: 'relative',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 6,
          left: 12,
          fontSize: 18,
          fontWeight: 700,
          color: areaColors.labelColor,
          background: areaColors.labelBackground,
          padding: '6px 16px',
          borderRadius: 6,
          letterSpacing: '0.01em',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        }}
      >
        {data.label || id}
      </div>
    </div>
  );
}
