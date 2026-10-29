import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/context'
import { registerCustomer } from '../features/auth/api'
import { registrationSchema } from '../features/auth/schemas'
import { loginDestination } from '../features/auth/roles'
import AuthLayout from '../features/auth/AuthLayout'
import InputField from '../components/InputField'
import '../styles/forms.css'
import useUnsavedChanges from '../features/navigation/useUnsavedChanges'

export default function RegisterPage() {
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
    resolver: zodResolver(registrationSchema),
    defaultValues: { fullName: '', phone: '', email: '', password: '', confirmPassword: '' },
  })
  const protection = useUnsavedChanges(isDirty, 'Đăng ký khách hàng')
  if (auth.user && !auth.error) return <Navigate to={loginDestination(auth.user.role)} replace />
  async function submit(body) {
    setError(null)
    try {
      await registerCustomer(body)
      protection.clear()
      resetField('password')
      resetField('confirmPassword')
      navigate('/dang-nhap', {
        replace: true,
        state: { registered: true, returnTo: location.state?.returnTo },
      })
    } catch (failure) {
      resetField('password')
      resetField('confirmPassword')
      setError(failure.message)
    }
  }
  return (
    <AuthLayout
      title="Bắt đầu cùng VCoi."
      description="Tạo tài khoản khách hàng để gửi lịch thu gom và xem lại các đơn của bạn."
    >
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit(submit)} noValidate aria-label="Đăng ký khách hàng">
        <fieldset disabled={isSubmitting} className="form-fields">
          <legend className="sr-only">Thông tin khách hàng</legend>
          <InputField
            id="fullName"
            label="Họ và tên"
            autoComplete="name"
            required
            maxLength={100}
            error={errors.fullName}
            {...register('fullName')}
          />
          <InputField
            id="phone"
            label="Số điện thoại"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            required
            maxLength={10}
            error={errors.phone}
            {...register('phone')}
          />
          <InputField
            id="email"
            label="Email (không bắt buộc)"
            type="email"
            autoComplete="email"
            maxLength={254}
            error={errors.email}
            {...register('email')}
          />
          <InputField
            id="new-password"
            label="Mật khẩu"
            type="password"
            autoComplete="new-password"
            required
            maxLength={64}
            hint="12–64 ký tự, tối đa 72 byte UTF-8."
            error={errors.password}
            {...register('password')}
          />
          <InputField
            id="confirmPassword"
            label="Nhập lại mật khẩu"
            type="password"
            autoComplete="new-password"
            required
            maxLength={64}
            error={errors.confirmPassword}
            {...register('confirmPassword')}
          />
          <button className="button button-primary form-submit" type="submit">
            {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản khách hàng'}
          </button>
        </fieldset>
      </form>
      <p className="auth-switch">
        Đã có tài khoản?{' '}
        <Link to="/dang-nhap" state={{ returnTo: location.state?.returnTo }}>
          Đăng nhập
        </Link>
      </p>
    </AuthLayout>
  )
}
