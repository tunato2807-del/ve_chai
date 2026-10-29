import ProfileForm from '../features/account/ProfileForm'
import PasswordForm from '../features/account/PasswordForm'
import { useAuth } from '../features/auth/context'
import '../styles/account.css'
import '../styles/forms.css'
import '../styles/workspace.css'
export default function AccountPage() {
  const { user } = useAuth()
  if (!user) return null
  const admin = user.role === 'ADMIN'
  const description =
    user.role === 'CUSTOMER'
      ? 'Thông tin liên hệ và bảo mật cho những lần thu gom tiếp theo.'
      : 'Cập nhật thông tin cá nhân và bảo vệ tài khoản làm việc của bạn.'
  return (
    <section className="container workspace-page account-page">
      <header className="workspace-heading">
        <div>
          <h1>{admin ? 'Hồ sơ của tôi' : 'Tài khoản của tôi'}</h1>
          <p className="muted">{description}</p>
        </div>
      </header>
      <div className="account-grid">
        <ProfileForm key={`profile-${user.id}-${user.role}`} />
        <PasswordForm key={`password-${user.id}-${user.role}`} />
      </div>
    </section>
  )
}
