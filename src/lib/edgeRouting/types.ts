/**
 * Core types for smart edge routing system
 */

export type HandlePositionType = 'top' | 'right' | 'bottom' | 'left';

export interface ControlPoint {
  x: number;
  y: number;
  position?: HandlePositionType;
}

export interface NodeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HandlePosition {
  x: number;
  y: number;
  position: HandlePositionType;
}

export interface EdgeRoutingConfig {
  enabled: boolean;
  offset: number;           // Minimum distance from nodes
  cornerRadius: number;     // Rounded corner radius
  simplifyThreshold: number; // Point reduction threshold
}

export const DEFAULT_EDGE_ROUTING_CONFIG: EdgeRoutingConfig = {
  enabled: true,
  offset: 20,
  cornerRadius: 8,
  simplifyThreshold: 2,
};
