import { z } from 'zod'
import type { DashboardConfig, WidgetInstance } from './types.ts'

export const themeSchema = z.object({
  accent: z.string(),
})

const resizeHandleSchema = z.enum(['s', 'w', 'e', 'n', 'se', 'sw', 'ne', 'nw'])

export const layoutItemSchema = z.object({
  i: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  minW: z.number().optional(),
  minH: z.number().optional(),
  maxW: z.number().optional(),
  maxH: z.number().optional(),
  static: z.boolean().optional(),
  moved: z.boolean().optional(),
  isResizable: z.boolean().optional(),
  isDraggable: z.boolean().optional(),
  resizeHandles: z.array(resizeHandleSchema).optional(),
})

export const widgetInstanceSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  settings: z.record(z.string(), z.unknown()),
})

export const dashboardConfigSchema = z.object({
  version: z.literal(1),
  theme: themeSchema,
  layout: z.record(z.string(), z.array(layoutItemSchema)),
  widgets: z.array(widgetInstanceSchema).max(50),
})

export function validateConfig(raw: unknown): DashboardConfig {
  const result = dashboardConfigSchema.safeParse(raw)
  if (!result.success) {
    const issue = result.error.issues[0]
    const path = issue?.path.join('.') ?? 'unknown'
    throw new Error(`[deskmate:config] ${path}: ${issue?.message ?? 'invalid config'}`)
  }
  return result.data as DashboardConfig
}

export function isWidgetInstance(value: unknown): value is WidgetInstance {
  return widgetInstanceSchema.safeParse(value).success
}
