const key = 'vcoi.theme'
let preference
let transitionTimer
const normalize = (value) => (['light', 'dark'].includes(value) ? value : 'system')
function stored() {
  try {
    return normalize(localStorage.getItem(key))
  } catch {
    return 'system'
  }
}
function apply(mode) {
  const actual =
    mode === 'system'
      ? window.matchMedia?.('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : mode
  document.documentElement.dataset.theme = actual
  document.documentElement.style.colorScheme = actual
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', actual === 'dark' ? '#12221c' : '#f5f6f0')
}

function resolveTheme(mode) {
  return mode === 'system'
    ? window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
    : mode
}
export function initializeTheme() {
  preference = stored()
  apply(preference)
}
export function getTheme() {
  return (
    document.documentElement.dataset.theme ||
    (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  )
}
export function setTheme(mode) {
  const previousTheme = getTheme()
  preference = normalize(mode)
  try {
    localStorage.setItem(key, preference)
  } catch {
    /* Keep the choice for this open page. */
  }
  const nextTheme = resolveTheme(preference)
  const root = document.documentElement
  window.clearTimeout(transitionTimer)
  if (previousTheme !== nextTheme) {
    root.classList.add('theme-transitioning')
    transitionTimer = window.setTimeout(() => {
      root.classList.remove('theme-transitioning')
    }, 460)
  } else root.classList.remove('theme-transitioning')
  apply(preference)
  window.dispatchEvent(new Event('vcoi-theme'))
}
export function subscribeTheme(notify) {
  const media = window.matchMedia?.('(prefers-color-scheme: dark)')
  const system = () => {
    if ((preference ?? stored()) === 'system') {
      apply('system')
      notify()
    }
  }
  const storage = (event) => {
    if (event.key === key || event.key === null) {
      preference = stored()
      apply(preference)
      notify()
    }
  }
  media?.addEventListener?.('change', system)
  window.addEventListener('storage', storage)
  window.addEventListener('vcoi-theme', notify)
  return () => {
    media?.removeEventListener?.('change', system)
    window.removeEventListener('storage', storage)
    window.removeEventListener('vcoi-theme', notify)
  }
}
