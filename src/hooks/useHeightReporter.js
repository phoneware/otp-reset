import { useEffect, useRef } from 'react'

export function useHeightReporter(parentOrigin) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let lastHeight = 0

    function reportHeight() {
      const height = el.scrollHeight
      if (height !== lastHeight) {
        lastHeight = height
        window.parent.postMessage({ type: 'setHeight', height }, parentOrigin || '*')
      }
    }

    const observer = new ResizeObserver(reportHeight)
    observer.observe(el)
    reportHeight()

    return () => observer.disconnect()
  }, [parentOrigin])

  return ref
}
