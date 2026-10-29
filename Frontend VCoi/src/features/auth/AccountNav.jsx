import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './context'
import { signOut } from './api'
import { roleConfig } from './roles'
import { useConfirmDiscard } from '../navigation/useUnsavedChanges'
import { UserCircleIcon } from '@phosphor-icons/react/UserCircle'
import { SignOutIcon } from '@phosphor-icons/react/SignOut'

export default function AccountNav({ closeMenu, showWorkspace = true, iconOnly = false }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const confirmDiscard = useConfirmDiscard()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  async function logout() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await signOut()
      await auth.acceptUser(null)
      closeMenu()
      navigate('/', { replace: true })
    } catch (failure) {
      if (failure.status === 401) {
        await auth.acceptUser(null)
        closeMenu()
        navigate('/', { replace: true })
      } else setError('Chưa xác nhận được đăng xuất. Vui lòng thử lại.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="account-navigation">
      {auth.user ? (
        <>
          {showWorkspace && (
            <Link
              className={iconOnly ? 'workspace-icon-link icon-button' : undefined}
              to={roleConfig[auth.user.role].home}
              aria-label={iconOnly ? 'Khu vực của tôi' : undefined}
              title={iconOnly ? 'Khu vực của tôi' : undefined}
              onClick={closeMenu}
            >
              {iconOnly ? (
                <UserCircleIcon size={23} weight="regular" aria-hidden="true" />
              ) : (
                'Khu vực của tôi'
              )}
            </Link>
          )}
          <button
            className="nav-logout"
            type="button"
            disabled={busy}
            aria-busy={busy || undefined}
            onClick={() => confirmDiscard(logout)}
          >
            <SignOutIcon size={18} aria-hidden="true" />
            <span>{busy ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
          </button>
        </>
      ) : (
        <Link className="nav-account-button" to="/dang-nhap" onClick={closeMenu}>
          Đăng nhập
        </Link>
      )}
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
