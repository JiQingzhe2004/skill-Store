import { InputHTMLAttributes } from 'react'

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export function FormField({ label, error, ...props }: FormFieldProps) {
  return (
    <div className="field">
      <label htmlFor={props.id}>{label}</label>
      <input {...props} />
      {error ? <span className="error-text">{error}</span> : null}
    </div>
  )
}
