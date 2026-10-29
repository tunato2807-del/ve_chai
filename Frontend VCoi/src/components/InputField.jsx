import { useState } from 'react'
import { EyeIcon } from '@phosphor-icons/react/Eye'
import { EyeSlashIcon } from '@phosphor-icons/react/EyeSlash'

export default function InputField({
  label,
  error,
  hint,
  id,
  type = 'text',
  as: Tag = 'input',
  ...props
}) {
  const [visible, setVisible] = useState(false)
  const describedBy =
    [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {props.required && <span aria-hidden="true"> *</span>}
      </label>
      <div className={type === 'password' ? 'password-input' : undefined}>
        <Tag
          {...props}
          id={id}
          {...(Tag === 'input' && { type: type === 'password' && visible ? 'text' : type })}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />
        {type === 'password' && (
          <button
            className="password-toggle"
            type="button"
            aria-label={`${visible ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? (
              <EyeSlashIcon size={20} aria-hidden="true" />
            ) : (
              <EyeIcon size={20} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {hint && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error.message}
        </p>
      )}
    </div>
  )
}
