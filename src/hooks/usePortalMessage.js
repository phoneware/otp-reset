import { useEffect } from 'react'

export function usePortalMessage(onInit) {
  useEffect(() => {
    function handler(event) {
      const data = event.data
      if (data && data.type === 'init' && data.token && data.domain) {
        onInit({ token: data.token, domain: data.domain, origin: event.origin })
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [onInit])
}
