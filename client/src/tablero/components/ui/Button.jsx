const variants = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-500',
  secondary:
    'bg-surface text-muted ring-1 ring-line hover:bg-sunken',
  danger: 'bg-red-600 text-white hover:bg-red-500',
  ghost:
    'bg-transparent text-muted hover:bg-sunken',
  quiet: 'bg-transparent text-current hover:bg-sunken',
  iconDanger:
    'bg-transparent text-muted hover:bg-chip-red hover:text-chip-red-ink',
}

const sizes = {
  md: 'px-3.5 py-2 text-sm',
  sm: 'px-2.5 py-1.5 text-sm',
  icon: 'px-2 py-1 text-lg leading-none',
}

const aligns = {
  center: 'justify-center',
  start: 'justify-start',
}

export function Button({
  variant = 'primary',
  size = 'md',
  align = 'center',
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex cursor-pointer items-center gap-2 rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${aligns[align]} ${className}`}
      {...props}
    />
  )
}
