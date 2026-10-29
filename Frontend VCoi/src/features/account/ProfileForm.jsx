import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../auth/context'
import { getSession } from '../auth/api'
import { profileFormSchema, updateProfile } from '../auth/account-api'
import useAuthenticatedAction from '../auth/useAuthenticatedAction'
import ActionFeedback from '../../components/ActionFeedback'
import InputField from '../../components/InputField'
import useUnsavedChanges from '../navigation/useUnsavedChanges'

export default function ProfileForm() {
  const auth = useAuth(),
    user = auth.user
  const form = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { fullName: user.fullName, email: user.email || '' },
  })
  const protection = useUnsavedChanges(form.formState.isDirty, 'Hồ sơ cá nhân')
  const state = useAuthenticatedAction(async (sameSession) => {
    const fresh = await getSession()
    if (!sameSession()) return
    if (!fresh) {
      await auth.acceptUser(null)
      return
    }
    if (fresh?.id !== user.id || fresh.role !== user.role) throw new Error('Session changed')
    await auth.acceptUser(fresh)
    form.reset({ fullName: fresh.fullName, email: fresh.email || '' })
  }, user.role)
  function submit() {
    void state.run(
      () => updateProfile(user, form.getValues()),
      async (fresh) => {
        protection.clear()
        await auth.acceptUser(fresh)
        form.reset({ fullName: fresh.fullName, email: fresh.email || '' })
      },
      'Đã cập nhật hồ sơ của bạn.',
    )
  }
  return (
    <section className="workspace-panel account-section">
      <header className="panel-heading">
        <h2>Hồ sơ cá nhân</h2>
        <button
          className="text-button"
          type="button"
          disabled={state.busy}
          onClick={() => protection.confirmDiscard(() => void state.refresh())}
        >
          Tải lại hồ sơ
        </button>
      </header>
      <ActionFeedback state={state} />
      <p className="account-contact">
        Số điện thoại đăng nhập <strong>{user.phone}</strong>
      </p>
      <form onSubmit={form.handleSubmit(submit)} noValidate aria-label="Sửa hồ sơ">
        <fieldset disabled={state.busy || state.blocked} className="form-fields">
          <legend className="sr-only">Tên và email</legend>
          <InputField
            id="profile-fullName"
            label="Họ và tên"
            autoComplete="name"
            maxLength={100}
            required
            error={form.formState.errors.fullName}
            {...form.register('fullName')}
          />
          <InputField
            id="profile-email"
            label="Email (không bắt buộc)"
            type="email"
            autoComplete="email"
            maxLength={254}
            error={form.formState.errors.email}
            {...form.register('email')}
          />
          <button className="button button-primary" type="submit">
            {state.busy ? 'Đang lưu…' : 'Lưu hồ sơ'}
          </button>
        </fieldset>
      </form>
    </section>
  )
}
