import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/context'
import { changePassword, passwordFormSchema } from '../auth/account-api'
import useAuthenticatedAction from '../auth/useAuthenticatedAction'
import ActionFeedback from '../../components/ActionFeedback'
import InputField from '../../components/InputField'
import useUnsavedChanges from '../navigation/useUnsavedChanges'

export default function PasswordForm() {
  const auth = useAuth(),
    navigate = useNavigate()
  const form = useForm({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })
  const protection = useUnsavedChanges(form.formState.isDirty, 'Đổi mật khẩu')
  const state = useAuthenticatedAction(async () => {
    protection.clear()
    form.reset()
    await auth.acceptUser(null)
    navigate('/dang-nhap', { replace: true, state: { passwordChanged: true } })
  }, auth.user.role)
  async function submit() {
    try {
      await state.run(
        () => changePassword(form.getValues()),
        async () => {
          protection.clear()
          form.reset()
          await auth.acceptUser(null)
          navigate('/dang-nhap', { replace: true, state: { passwordChanged: true } })
        },
      )
    } finally {
      form.reset()
    }
  }
  return (
    <section className="workspace-panel account-section">
      <h2>Bảo mật tài khoản</h2>
      <p className="account-description">
        Mật khẩu mới cần 12-64 ký tự. Sau khi đổi, bạn sẽ đăng nhập lại trên các thiết bị.
      </p>
      <details className="account-details">
        <summary>Đổi mật khẩu</summary>
        <ActionFeedback state={state} />
        {state.blocked && (
          <button
            className="text-button"
            type="button"
            disabled={state.busy}
            onClick={() => void state.refresh()}
          >
            Đăng nhập lại để kiểm tra
          </button>
        )}
        <form onSubmit={form.handleSubmit(submit)} noValidate aria-label="Đổi mật khẩu">
          <fieldset className="form-fields" disabled={state.busy || state.blocked}>
            <legend className="sr-only">Mật khẩu hiện tại và mới</legend>
            {[
              ['currentPassword', 'Mật khẩu hiện tại', 'current-password'],
              ['newPassword', 'Mật khẩu mới', 'new-password'],
              ['confirmPassword', 'Nhập lại mật khẩu mới', 'new-password'],
            ].map(([name, label, autoComplete]) => (
              <InputField
                key={name}
                id={`change-${name}`}
                label={label}
                type="password"
                autoComplete={autoComplete}
                required
                maxLength={64}
                error={form.formState.errors[name]}
                {...form.register(name)}
              />
            ))}
            <button className="button button-primary" type="submit">
              {state.busy ? 'Đang đổi…' : 'Lưu mật khẩu mới'}
            </button>
          </fieldset>
        </form>
      </details>
    </section>
  )
}
