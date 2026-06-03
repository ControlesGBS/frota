import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('frota-theme') === 'dark'
  })

  useEffect(() => {
    document.body.classList.toggle('dark', dark)
    localStorage.setItem('frota-theme', dark ? 'dark' : 'light')
  }, [dark])

  return [dark, () => setDark(d => !d)]
}
