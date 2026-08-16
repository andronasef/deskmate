import { useEffect, useRef, useState } from 'react'

/**
 * IntersectionObserver-based lazy mounting (D-4.14): returns true once the target
 * element is near-visible (rootMargin 200px). Falls back to true when IO is
 * unavailable (test env / older browsers) so rendering never blocks.
 */
export function useLazyMount(ref: React.RefObject<HTMLElement | null>, rootMargin = '200px'): boolean {
  const ioAvailable =
    typeof window !== 'undefined' &&
    typeof (window as unknown as { IntersectionObserver?: typeof IntersectionObserver }).IntersectionObserver === 'function'
  const [near, setNear] = useState(() => !ioAvailable)
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current || !ioAvailable) {
      return
    }
    const el = ref.current
    if (el == null) {
      return
    }
    const IO = (window as unknown as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver
    const observer = new IO(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            firedRef.current = true
            setNear(true)
            observer.disconnect()
            break
          }
        }
      },
      { rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, rootMargin, ioAvailable])

  return near
}
