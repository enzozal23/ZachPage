import { useState } from 'react'
import inicioIcon from '../../images/inicio.png'
import loginIcon from '../../images/login.png'
import tableroIcon from '../../images/tablero.png'

const MARKS = [inicioIcon, loginIcon, tableroIcon]

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-11 text-[15px] text-white placeholder:text-white/30 outline-none transition ' +
  'hover:border-white/20 focus:border-violet-400/70 focus:bg-white/[0.07] focus:shadow-[0_0_0_4px_rgba(139,92,246,0.18)] ' +
  '[&:-webkit-autofill]:[-webkit-text-fill-color:#fff] [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#1f1733]'

const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

const MailIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="m4 7 8 6 8-6" />
  </svg>
)

const LockIcon = () => (
  <svg {...iconProps}>
    <rect x="4" y="10" width="16" height="10" rx="3" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
)

const EyeIcon = ({ off }) => (
  <svg {...iconProps}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
)

const AlertIcon = () => (
  <svg {...iconProps} width={16} height={16}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16h.01" />
  </svg>
)

const Spinner = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" className="animate-spin" aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
)

function Field({ label, icon, trailing, ...inputProps }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-white/70">{label}</span>
      <span className="group relative flex items-center">
        <span className="pointer-events-none absolute left-3.5 text-white/35 transition group-focus-within:text-violet-300">
          {icon}
        </span>
        <input className={`${inputClass} ${trailing ? 'pr-12' : 'pr-3.5'}`} {...inputProps} />
        {trailing}
      </span>
    </label>
  )
}

function LoginPage({ onLogin, serverError }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [attempt, setAttempt] = useState(0)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await onLogin(email, password)
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.')
      setAttempt((n) => n + 1)
    } finally {
      setBusy(false)
    }
  }

  const message = error || serverError

  return (
    <main className="login-page relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-[#160f24] px-4 py-10 font-sans text-white">
      <div className="login-aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
      />

      <section className="login-card relative w-full max-w-[400px] rounded-[28px] border border-white/10 bg-white/[0.045] px-7 pt-10 pb-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl">
        <div
          aria-hidden="true"
          className="absolute inset-x-12 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(196,181,253,0.8),transparent)]"
        />

        <header className="flex flex-col items-center text-center">
          <div className="login-reel" aria-hidden="true">
            {MARKS.map((src) => (
              <img key={src} src={src} alt="" />
            ))}
          </div>
          <h1 className="mt-8 font-[Fraunces,Georgia,serif] text-[2.4rem] leading-none font-normal tracking-[0.03em]">
            Lexora
          </h1>
          <p className="mt-2.5 text-sm text-white/50">Ingresá a tu cuenta para continuar</p>
        </header>

        <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
          <Field
            label="Email"
            icon={<MailIcon />}
            autoFocus
            type="email"
            autoComplete="email"
            placeholder="nombre@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Field
            label="Contraseña"
            icon={<LockIcon />}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-2 grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white/80"
              >
                <EyeIcon off={showPassword} />
              </button>
            }
          />

          {message && (
            <p
              key={attempt}
              role="alert"
              className="login-shake flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200"
            >
              <span className="mt-px shrink-0">
                <AlertIcon />
              </span>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="login-btn relative mt-2 flex h-12 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-[linear-gradient(135deg,#8b5cf6,#6d28d9_55%,#c026d3)] text-[15px] font-semibold text-white shadow-[0_12px_30px_-10px_rgba(139,92,246,0.9)] transition hover:-translate-y-px hover:shadow-[0_16px_36px_-10px_rgba(192,38,211,0.8)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {busy ? (
              <>
                <Spinner /> Ingresando…
              </>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>
      </section>
    </main>
  )
}

export default LoginPage
