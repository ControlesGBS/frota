import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('frota-theme')
    // dark é o padrão — só usa light se explicitamente salvo
    return saved !== 'light'
  })

  useEffect(() => {
    if (dark) {
      document.body.classList.remove('light')
    } else {
      document.body.classList.add('light')
    }
    localStorage.setItem('frota-theme', dark ? 'dark' : 'light')
  }, [dark])

  return [dark, () => setDark(d => !d)]
}
