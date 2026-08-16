/** Per-device custom-widget iframe budgets (D-4.13). */
export const IFRAME_BUDGETS = { mobile: 8, desktop: 20 } as const

export interface BudgetState {
  atLimit: boolean
  count: number
  device: 'mobile' | 'desktop'
}

function isMobile(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(max-width: 768px)').matches
}

/** Guard hook: counts mounted custom-widget frames and reports whether the budget is exhausted. */
export function useIframeBudget(count: number): BudgetState {
  const device = isMobile() ? 'mobile' : 'desktop'
  const limit = IFRAME_BUDGETS[device]
  return { atLimit: count >= limit, count, device }
}
