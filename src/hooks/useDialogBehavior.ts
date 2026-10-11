import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Shared dialog behavior for modals and the mobile drawer:
 * - moves focus into the surface when opened, restores it on close
 * - cycles Tab / Shift+Tab within the surface
 * - closes on Escape
 * - locks background scrolling while open
 */
export function useDialogBehavior(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onClose: () => void,
) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!active) return
    const node = ref.current
    const previouslyFocused = document.activeElement as HTMLElement | null

    node?.focus()
    const items = () =>
      node ? Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)) : []

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); return }
      if (e.key !== 'Tab' || !node) return
      const list = items()
      if (list.length === 0) return
      const firstEl = list[0] as HTMLElement
      const lastEl = list[list.length - 1] as HTMLElement
      const current = document.activeElement
      if (!node.contains(current)) { e.preventDefault(); firstEl.focus(); return }
      if (e.shiftKey && current === firstEl) { e.preventDefault(); lastEl.focus(); return }
      if (!e.shiftKey && current === lastEl) { e.preventDefault(); firstEl.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [ref, active])
}
