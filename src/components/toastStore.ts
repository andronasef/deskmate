import { useCallback, useEffect, useState } from 'react'

export type ToastKind = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

type Listener = (items: ToastItem[]) => void

let toasts: ToastItem[] = []
const listeners = new Set<Listener>()
let nextId = 1
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function emit() {
  for (const listener of listeners) {
    listener(toasts)
  }
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  const timer = timers.get(id)
  if (timer != null) {
    clearTimeout(timer)
    timers.delete(id)
  }
  emit()
}

/** Show a toast from anywhere (no provider needed). */
export function showToast(kind: ToastKind, message: string) {
  const id = nextId++
  toasts = [...toasts.slice(-2), { id, kind, message }]
  emit()
  timers.set(
    id,
    setTimeout(() => dismiss(id), 3500),
  )
}

export function useToast() {
  const show = useCallback((kind: ToastKind, message: string) => showToast(kind, message), [])
  return { show }
}

/** Subscribe to the current toast list (used by ToastHost). */
export function useToastItems(): ToastItem[] {
  const [items, setItems] = useState<ToastItem[]>(toasts)
  useEffect(() => {
    const listener: Listener = (next) => setItems(next)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])
  return items
}

export function dismissToast(id: number) {
  dismiss(id)
}
