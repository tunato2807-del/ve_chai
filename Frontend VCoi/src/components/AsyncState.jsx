import { CircleNotchIcon } from '@phosphor-icons/react/CircleNotch'
import { TrayIcon } from '@phosphor-icons/react/Tray'
import { WarningCircleIcon } from '@phosphor-icons/react/WarningCircle'

export default function AsyncState({ title, message, retry, busy = false }) {
  const Icon = busy ? CircleNotchIcon : retry ? WarningCircleIcon : TrayIcon
  return (
    <section className="data-state" role={retry ? 'alert' : 'status'} aria-busy={busy}>
      <span className={`state-symbol${busy ? ' is-loading' : ''}`} aria-hidden="true">
        <Icon size={28} weight="light" />
      </span>
      <h2>{title}</h2>
      {message && <p>{message}</p>}
      {busy && (
        <div className="state-skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
      {retry && (
        <button className="button button-secondary" type="button" onClick={retry}>
          Thử lại
        </button>
      )}
    </section>
  )
}
