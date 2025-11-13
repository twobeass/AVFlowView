// AVFlowView Color Configuration

interface CategoryColorScheme {
  background: string;
  border: string;
  accent: string;
}

export const categoryColors: Record<string, CategoryColorScheme> = {
  Audio: {
    background: '#E8F5E9',
    border: '#2E7D32',
    accent: '#4CAF50',
  },
  Video: {
    background: '#E3F2FD',
    border: '#1565C0',
    accent: '#2196F3',
  },
  Network: {
    background: '#FFF3E0',
    border: '#E65100',
    accent: '#FF9800',
  },
  Control: {
    background: '#F3E5F5',
    border: '#6A1B9A',
    accent: '#9C27B0',
  },
  Power: {
    background: '#FFEBEE',
    border: '#C62828',
    accent: '#F44336',
  },
  Default: {
    background: '#F5F5F5',
    border: '#616161',
    accent: '#9E9E9E',
  },
};

export const portAlignmentColors = {
  In: '#1976D2',
  Out: '#43A047',
  Bidirectional: '#F57C00',
};

export const edgeCategoryColors = {
  Audio: '#4CAF50',      // Green
  Video: '#2196F3',      // Blue
  Network: '#FF9800',    // Orange
  Control: '#9C27B0',    // Purple
  Power: '#F44336',      // Red
  Default: '#616161',    // Gray
};

export const areaColors = {
  background: 'rgba(240, 245, 250, 0.65)',
  border: '#90A4AE',
  labelBackground: 'rgba(255, 255, 255, 0.95)',
  labelColor: '#37474F',
};

export const textColors = {
  primary: '#212121',
  secondary: '#666666',
  tertiary: '#9E9E9E',
};
