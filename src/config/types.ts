export type ConfigVersion = 1;

export interface ThemeConfig {
  accent: string;
}

export type ResizeHandle = 's' | 'w' | 'e' | 'n' | 'se' | 'sw' | 'ne' | 'nw';

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
  moved?: boolean;
  isResizable?: boolean;
  isDraggable?: boolean;
  resizeHandles?: ResizeHandle[];
}

export type LayoutMap = Record<string, LayoutItem[]>;

export interface WidgetInstance {
  id: string;
  type: string;
  settings: Record<string, unknown>;
}

export interface DashboardConfig {
  version: ConfigVersion;
  theme: ThemeConfig;
  layout: LayoutMap;
  widgets: WidgetInstance[];
}
