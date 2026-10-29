import useUnsavedChanges from '../navigation/useUnsavedChanges'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import InputField from '../../components/InputField'
import { registrationSchema } from '../auth/schemas'

export default function CollectorAccountForm({ disabled, busy, onSave, onClose }) {
  const form = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: { fullName: '', phone: '', email: '', password: '', confirmPassword: '' },
  })

  const protection = useUnsavedChanges(form.formState.isDirty, 'Tạo nhân viên thu gom')
  const { setFocus } = form
  useEffect(() => {
    setFocus('fullName')
  }, [setFocus])
  const field = (name, label, extra = {}) => (
    <InputField
      id={`staff-${name}`}
      label={label}
      error={form.formState.errors[name]}
      {...extra}
      {...form.register(name)}
    />
  )
  async function submit() {
    await onSave(form.getValues())
    form.resetField('password')
    form.resetField('confirmPassword')
  }
  return (
    <section
      className="workspace-panel catalog-form account-form"
      aria-labelledby="staff-form-title"
    >
      <h2 id="staff-form-title">Tạo tài khoản nhân viên thu gom</h2>
      <p>
        Nhân viên mới có quyền thu gom và trạng thái đang hoạt động. Tài khoản admin hiện tại vẫn
        được giữ nguyên.
      </p>
      <form onSubmit={form.handleSubmit(submit)} noValidate aria-label="Tạo nhân viên thu gom">
        <fieldset className="form-fields" disabled={disabled}>
          <legend className="sr-only">Thông tin nhân viên mới</legend>
          <div className="catalog-form-grid">
            {field('fullName', 'Họ và tên', {
              required: true,
              maxLength: 100,
              autoComplete: 'off',
            })}
            {field('phone', 'Số điện thoại', {
              required: true,
              type: 'tel',
              inputMode: 'tel',
              maxLength: 10,
              autoComplete: 'off',
              hint: '10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.',
            })}
            {field('email', 'Email (không bắt buộc)', {
              type: 'email',
              maxLength: 254,
              autoComplete: 'off',
            })}
            <div className="account-form-role">
              <span>Vai trò được cấp</span>
              <strong>Nhân viên thu gom</strong>
              <p>Chỉ thao tác trên những đơn được phân công.</p>
            </div>
            {field('password', 'Mật khẩu ban đầu', {
              required: true,
              type: 'password',
              maxLength: 64,
              autoComplete: 'new-password',
              hint: '12–64 ký tự, tối đa 72 byte UTF-8.',
            })}
            {field('confirmPassword', 'Xác nhận mật khẩu', {
              required: true,
              type: 'password',
              maxLength: 64,
              autoComplete: 'new-password',
            })}
          </div>
          <div className="catalog-actions">
            <button className="button button-primary" type="submit">
              {busy ? 'Đang tạo…' : 'Lưu nhân viên'}
            </button>
            <button
              className="text-button"
              type="button"
              onClick={() => protection.confirmDiscard(onClose)}
            >
              Đóng biểu mẫu
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  )
}
