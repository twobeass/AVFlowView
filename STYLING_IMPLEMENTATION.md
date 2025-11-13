# AVFlowView Styling Implementation

**Last Updated**: November 13, 2025  
**Status**: ✅ COMPLETE - Professional Styling System Implemented

## Overview

Comprehensive styling system with centralized color configuration, side-by-side port layout, and category-based visual distinction for professional A/V wiring diagrams.

## Color Configuration System

### File: `src/config/colors.ts`

All colors are centralized in a single TypeScript configuration file for easy customization and maintenance.

#### Category Color Scheme

```typescript
categoryColors = {
  Audio: {
    background: '#E8F5E9',  // Light green
    border: '#2E7D32',       // Dark green
    accent: '#4CAF50',       // Medium green
  },
  Video: {
    background: '#E3F2FD',  // Light blue
    border: '#1565C0',       // Dark blue
    accent: '#2196F3',       // Medium blue
  },
  Network: {
    background: '#FFF3E0',  // Light orange
    border: '#E65100',       // Dark orange
    accent: '#FF9800',       // Medium orange
  },
  Control: {
    background: '#F3E5F5',  // Light purple
    border: '#6A1B9A',       // Dark purple
    accent: '#9C27B0',       // Medium purple
  },
  Power: {
    background: '#FFEBEE',  // Light red
    border: '#C62828',       // Dark red
    accent: '#F44336',       // Medium red
  },
}
```

#### Port Alignment Colors

```typescript
portAlignmentColors = {
  In: '#1976D2',           // Blue
  Out: '#43A047',          // Green
  Bidirectional: '#F57C00', // Orange
}
```

#### Edge Category Colors

Edges are colored based on their `category` field to match device categories:
- Audio: Green (#4CAF50)
- Video: Blue (#2196F3)
- Network: Orange (#FF9800)
- Control: Purple (#9C27B0)
- Power: Red (#F44336)

## Node Layout System

### Side-by-Side Port Layout

Device nodes now use a CSS Grid layout with ports displayed side-by-side:

```
┌──────────────────────────────────────────┐
│  Device Label                            │
│  Manufacturer                            │
├──────────────────────────────────────────┤
│  ● Input 1 (Type)    |  Output 1 (Type) ●│
│  ● Input 2 (Type)    |  Output 2 (Type) ●│
│                      |  Output 3 (Type) ●│
│                                          │
│  ● Network Port (Bidirectional)          │
└──────────────────────────────────────────┘
```

### Node Dimensions

- **Width**: 400-500px (minWidth: 400px, maxWidth: 500px)
- **ELK Node Width**: 440px constant
- **Base Height**: 100px
- **Port Spacing**: 20px per port (PORT_HEIGHT_SPACING)

### Port Handle Positioning

Handles are positioned exactly on the node border edge:
- **Offset**: -20px from respective edge
- **Calculation**:
  - 12px inner padding
  - 2px border thickness
  - 6px to center 12px × 12px handle
  - Total: 20px

## Component Architecture

### DeviceNode.tsx

**Layout Structure:**
1. **Header Section**: Device label (16px, weight 600)
2. **Metadata Section**: Manufacturer info (13px)
3. **Ports Section**: CSS Grid layout
   - Grid columns: `1fr 1fr` (50/50 split)
   - Gap: 8px between columns
   - **Left Column**: Input ports (left-aligned)
   - **Right Column**: Output ports (right-aligned, `alignItems: 'flex-end'`)
   - **Below Grid**: Bidirectional ports (dynamic positioning)

**Port Rendering:**
```typescript
// Inputs
paddingLeft: '12px'
textAlign: 'left'
Handle left: '-20px'

// Outputs
paddingRight: '12px'
textAlign: 'right'
Handle right: '-20px'

// Bidirectional
Dynamic based on computedSide
Handle offset: '-20px' from respective edge
```

### GroupNode.tsx

**Styling:**
- Background: `rgba(240, 245, 250, 0.65)` (semi-transparent)
- Border: `2px dashed #90A4AE`
- Border radius: 12px
- Label: Positioned top-left with white background

### AVWiringViewer.tsx

**Edge Color Mapping:**
```typescript
function getEdgeCategoryColor(category: string) {
  return edgeCategoryColors[category] || edgeCategoryColors.Default;
}
```

Edges are styled with:
- Stroke width: 2.5px
- Color: Based on edge category
- Type: Default React Flow edges

## Layout Configuration

### ELK.js Settings

```typescript
layoutOptions: {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.spacing.nodeNode': '100',
  'elk.layered.spacing.nodeNodeBetweenLayers': '150',
  'elk.layered.spacing.edgeNodeBetweenLayers': '50',
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
  'elk.padding': '[top=30,left=30,bottom=30,right=30]',
}
```

### Area Padding

```typescript
'elk.padding': '[top=50,left=30,bottom=30,right=30]'
```

Extra top padding (50px) accommodates area labels.

## Typography System

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Helvetica Neue', Arial, sans-serif;
```

### Text Hierarchy
- **Device Labels**: 16px, weight 600, color #212121
- **Manufacturer**: 13px, color #666
- **Port Labels**: 12px, color #9E9E9E (textColors.tertiary)
- **Area Labels**: 18px, weight 700, color #37474F

## Visual Polish

### Shadows
- **Device Nodes**: `box-shadow: 0 2px 8px rgba(0,0,0,0.12)`
- **Area Labels**: `box-shadow: 0 1px 4px rgba(0,0,0,0.1)`
- **Areas**: `box-shadow: inset 0 1px 3px rgba(0,0,0,0.05)`

### Transitions
All handles include smooth transitions:
```css
transition: all 0.2s ease-in-out
```

## Customization Guide

### Changing Colors

Edit `src/config/colors.ts`:

```typescript
// Example: Change Audio category to blue
categoryColors.Audio = {
  background: '#E3F2FD',
  border: '#1565C0',
  accent: '#2196F3',
}
```

### Adjusting Node Width

1. **DeviceNode.tsx**: Update minWidth/maxWidth
2. **elkMapper.ts**: Update NODE_WIDTH constant

### Modifying Port Layout

Edit grid configuration in DeviceNode.tsx:
```typescript
gridTemplateColumns: '1fr 1fr'  // Change ratio or add columns
gap: 8  // Adjust spacing
```

## Implementation Files

| File | Purpose |
|------|---------|
| `src/config/colors.ts` | Centralized color configuration |
| `src/components/nodes/DeviceNode.tsx` | Device node rendering with side-by-side layout |
| `src/components/nodes/GroupNode.tsx` | Area/group node rendering |
| `src/components/AVWiringViewer.tsx` | Main viewer with edge coloring |
| `src/lib/elkMapper.ts` | Layout constants and ELK configuration |

## Benefits

✅ **Centralized Management**: All colors in one file  
✅ **Type Safety**: TypeScript interfaces for color schemes  
✅ **Professional Appearance**: Industry-standard color coding  
✅ **Better Readability**: Wider nodes, clear layout  
✅ **Easy Customization**: Simple to modify colors and spacing  
✅ **Consistent Styling**: Unified design system  
✅ **No Overlaps**: Proper spacing and positioning  
✅ **Visual Hierarchy**: Clear distinction between element types  

## Future Enhancements

- [ ] Dark mode support with alternative color scheme
- [ ] User-configurable color themes
- [ ] Export color palette to CSS variables
- [ ] Accessibility improvements (WCAG AA contrast ratios)
- [ ] Hover state enhancements
- [ ] Selected state styling
