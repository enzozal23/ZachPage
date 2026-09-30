export function Field({ label, className = '', children }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 text-sm font-medium text-muted ${className}`}>
      {label}
      {children}
    </label>
  )
}
