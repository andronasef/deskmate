import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { READY_TIMEOUT_MS, SANDBOX_TOKENS, generateNonce } from './constants.ts'
import { buildSrcdoc, type DeskMateApiPayload, type WidgetCode } from './bootstrap.ts'
import { createSandboxBridge, type SandboxBridge } from './bridge.ts'
import type { WidgetInstance } from '../../config/types.ts'
import type { WidgetTheme } from '../theme.ts'
import styles from './IframeWidgetRenderer.module.css'

interface IframeWidgetRendererProps {
  widget: WidgetInstance
  theme: WidgetTheme
  /** Override code for the editor's live preview (unsaved edits). */
  previewCode?: WidgetCode | null
}

type SandboxState = 'loading' | 'ready' | 'crashed'

function widgetCode(widget: WidgetInstance): WidgetCode {
  const s = widget.settings as { html?: unknown; css?: unknown; js?: unknown }
  return {
    html: typeof s.html === 'string' ? s.html : '',
    css: typeof s.css === 'string' ? s.css : '',
    js: typeof s.js === 'string' ? s.js : '',
  }
}

/**
 * Sandboxed custom-widget renderer (BYOW-03/04/05): srcdoc iframe with EXACTLY
 * sandbox="allow-scripts", nonce-validated bridge, ready timeout → crash fallback,
 * explicit teardown (bridge destroyed, timeout cleared — no zombies).
 */
export function IframeWidgetRenderer({ widget, theme, previewCode }: IframeWidgetRendererProps) {
  const code = previewCode ?? widgetCode(widget)
  const codeHtml = code.html
  const codeCss = code.css
  const codeJs = code.js
  const [state, setState] = useState<SandboxState>('loading')
  // Per-widget secret, stable for the component's life (lazy state — readable during render).
  const [nonce] = useState<string>(() => generateNonce())
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const bridgeRef = useRef<SandboxBridge | null>(null)
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })

  const srcdoc = useMemo(
    () => buildSrcdoc({ html: codeHtml, css: codeCss, js: codeJs }, nonce),
    [codeHtml, codeCss, codeJs, nonce],
  )

  const pushApi = useCallback(
    (extra?: Partial<DeskMateApiPayload>) => {
      bridgeRef.current?.push({
        theme: { accent: theme.accent },
        size: containerSize,
        config: null,
        ...extra,
      })
    },
    [theme.accent, containerSize],
  )

  // Lifecycle: attach bridge, ready timeout, ResizeObserver, teardown.
  useEffect(() => {
    const iframe = iframeRef.current
    if (iframe == null) {
      return
    }
    setState('loading')

    const bridge = createSandboxBridge(iframe, nonce, () => {
      setState('ready')
      pushApi()
    })
    bridge.attach()
    bridgeRef.current = bridge

    const timeout = setTimeout(() => {
      setState((s) => (s === 'ready' ? s : 'crashed'))
    }, READY_TIMEOUT_MS)

    let ro: ResizeObserver | null = null
    const RO = (window as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver
    if (typeof RO === 'function') {
      ro = new RO((entries) => {
        const entry = entries[0]
        if (entry != null) {
          const { width, height } = entry.contentRect
          setContainerSize({ w: Math.round(width), h: Math.round(height) })
        }
      })
      ro.observe(iframe)
    }

    return () => {
      // Teardown (BYOW-05): destroy bridge (removes listener + invalidates), clear timer, disconnect observer.
      clearTimeout(timeout)
      bridge.destroy()
      bridgeRef.current = null
      ro?.disconnect()
    }
  }, [srcdoc, nonce, pushApi])

  // Push updates when theme/size change (D-4.06).
  useEffect(() => {
    if (state === 'ready') {
      pushApi()
    }
  }, [state, pushApi])

  return (
    <div className={styles.root} data-sandbox-state={state}>
      {state === 'loading' && <div className={styles.placeholder}>Loading widget…</div>}
      {state === 'crashed' && (
        <div className={styles.placeholder} data-crashed>
          <p className={styles.crashTitle}>Widget failed to load</p>
          <p className={styles.crashHint}>It may have crashed or timed out.</p>
        </div>
      )}
      <iframe
        ref={iframeRef}
        className={styles.frame}
        sandbox={SANDBOX_TOKENS}
        referrerPolicy="no-referrer"
        srcDoc={srcdoc}
        title="Custom widget sandbox"
        data-testid="sandbox-frame"
        style={state === 'ready' ? undefined : { visibility: 'hidden', position: 'absolute' }}
      />
    </div>
  )
}
