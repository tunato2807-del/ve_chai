import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/context'
import { signIn } from '../features/auth/api'
import { loginSchema } from '../features/auth/schemas'
import { loginDestination } from '../features/auth/roles'
import AuthLayout from '../features/auth/AuthLayout'
import InputField from '../components/InputField'
import '../styles/forms.css'
import useUnsavedChanges from '../features/navigation/useUnsavedChanges'

export default function LoginPage() {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  })
  const protection = useUnsavedChanges(isDirty, 'Đăng nhập')
  const returnTo = location.state?.returnTo
  if (auth.user && !auth.error)
    return <Navigate to={loginDestination(auth.user.role, returnTo)} replace />
  async function submit(body) {
    setError(null)
    try {
      const user = await signIn(body)
      protection.clear()
      resetField('password')
      await auth.acceptUser(user)
      navigate(loginDestination(user.role, returnTo), { replace: true })
    } catch (failure) {
      resetField('password')
      setError(failure.message)
    }
  }
  return (
    <AuthLayout
      title="Chào bạn, mừng trở lại."
      description="Đăng nhập để đặt lịch và theo dõi hoạt động thu gom của bạn."
    >
      {location.state?.registered && (
        <p className="form-notice" role="status">
          Tạo tài khoản thành công. Bạn có thể đăng nhập ngay.
        </p>
      )}
      {location.state?.passwordChanged && (
        <p className="form-notice" role="status">
          Vui lòng đăng nhập lại bằng mật khẩu mới. Nếu chưa đổi thành công, dùng mật khẩu hiện tại
          của bạn.
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit(submit)} noValidate aria-label="Đăng nhập">
        <fieldset disabled={isSubmitting} className="form-fields">
          <legend className="sr-only">Thông tin đăng nhập</legend>
          <InputField
            id="identifier"
            label="Số điện thoại hoặc email"
            autoComplete="username"
            required
            maxLength={254}
            error={errors.identifier}
            {...register('identifier')}
          />
          <InputField
            id="password"
            label="Mật khẩu"
            type="password"
            autoComplete="current-password"
            required
            maxLength={64}
            error={errors.password}
            {...register('password')}
          />
          <button className="button button-primary form-submit" type="submit">
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </fieldset>
      </form>
      <p className="auth-switch">
        Bạn chưa có tài khoản?{' '}
        <Link to="/dang-ky" state={{ returnTo }}>
          Đăng ký khách hàng
        </Link>
      </p>
    </AuthLayout>
  )
}
