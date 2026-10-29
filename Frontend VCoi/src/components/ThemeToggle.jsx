import { useSyncExternalStore } from 'react'
import { SunIcon } from '@phosphor-icons/react/Sun'
import { MoonIcon } from '@phosphor-icons/react/Moon'
import { getTheme, setTheme, subscribeTheme } from '../features/theme/theme'

export default function ThemeToggle() {
  const dark = useSyncExternalStore(subscribeTheme, getTheme, () => 'light') === 'dark'
  const label = dark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'
  return (
    <button
      type="button"
      className="icon-button theme-toggle"
      aria-label={label}
      title={label}
      aria-pressed={dark}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      {dark ? (
        <SunIcon className="theme-toggle-symbol" size={21} aria-hidden="true" />
      ) : (
        <MoonIcon className="theme-toggle-symbol" size={21} aria-hidden="true" />
      )}
    </button>
  )
}
