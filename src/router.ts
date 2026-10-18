import { useEffect, useState } from 'react'

export function useRoute(): [string, (to: string) => void] {
  const read = () => window.location.hash.replace(/^#\/?/, '') || 'dashboard'
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const on = () => setRoute(read())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const go = (to: string) => {
    window.location.hash = '/' + to
    window.scrollTo({ top: 0 })
  }
  return [route, go]
}
