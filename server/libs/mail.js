import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import { logError, logInfo } from './appLog.js'

dotenv.config()

function mailFrom() {
  const user = process.env.GMAIL_USER?.trim() || process.env.MAIL_FROM_EMAIL?.trim()
  if (user) return { name: 'Lexora', email: user }
  return { name: 'Lexora', email: 'suplementoszach@gmail.com' }
}

function mailFromString() {
  const { name, email } = mailFrom()
  return `${name} <${email}>`
}

function envKey(...names) {
  for (const name of names) {
    if (process.env[name]?.trim()) return { name, value: process.env[name].trim() }
  }
  return null
}

function brevoCredentials() {
  return envKey('BREVO_API_KEY', 'SENDINBLUE_API_KEY', 'SIB_API_KEY')
}

function resendCredentials() {
  const named = envKey('RESEND_API_KEY', 'RESEND_KEY', 'RESEND', 'RESEND_TOKEN', 'API_KEY_RESEND', 'KEY_RESEND')
  if (named) return named
  const fuzzy = Object.keys(process.env).find((key) => /resend/i.test(key) && process.env[key])
  if (fuzzy) return { name: fuzzy, value: process.env[fuzzy] }
  return null
}

function gmailConfigured() {
  return Boolean(process.env.GMAIL_USER?.trim() && process.env.GMAIL_PASS?.trim())
}

function createGmailTransport(port, secure) {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port,
    secure,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  })
}

async function sendWithBrevo({ to, subject, text, apiKey }) {
  const sender = mailFrom()
  await logInfo('Enviando mail por Brevo', { to, subject, from: `${sender.name} <${sender.email}>` })

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(body?.message || body?.error || `Brevo respondió ${response.status}`)
    error.status = response.status
    error.response = JSON.stringify(body)
    throw error
  }

  await logInfo('Mail aceptado por Brevo', { to, subject, id: body.messageId || body.id })
  return body
}

async function sendWithResend({ to, subject, text, apiKey }) {
  const from = process.env.MAIL_FROM || mailFromString()
  await logInfo('Enviando mail por Resend', { to, subject, from })

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, text }),
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(body?.message || `Resend respondió ${response.status}`)
    error.status = response.status
    error.response = JSON.stringify(body)
    throw error
  }

  await logInfo('Mail aceptado por Resend', { to, subject, id: body.id })
  return body
}

async function sendWithGmail({ to, subject, text }) {
  const attempts = [
    { port: 587, secure: false },
    { port: 465, secure: true },
  ]
  let lastError = null

  for (const attempt of attempts) {
    await logInfo('Enviando mail por SMTP', {
      to,
      subject,
      host: 'smtp.gmail.com',
      port: attempt.port,
      fromUser: process.env.GMAIL_USER || 'GMAIL_USER vacío',
      passwordConfigured: Boolean(process.env.GMAIL_PASS),
    })
    try {
      const result = await createGmailTransport(attempt.port, attempt.secure).sendMail({
        from: mailFromString(),
        to,
        subject,
        text,
      })
      await logInfo('Gmail aceptó el mail', {
        to,
        subject,
        messageId: result.messageId,
        response: result.response,
        port: attempt.port,
      })
      return result
    } catch (error) {
      lastError = error
      await logError('Gmail no aceptó la conexión', error, { to, subject, port: attempt.port })
    }
  }

  throw lastError
}

export async function sendMail({ to, subject, text }) {
  const onRender = Boolean(process.env.RENDER)
  const brevo = brevoCredentials()
  const resend = resendCredentials()
  const gmail = gmailConfigured()

  await logInfo('Revisando cómo enviar el mail', {
    brevoConfigurado: Boolean(brevo),
    gmailConfigurado: gmail,
    resendConfigurada: Boolean(resend),
    enRender: onRender,
  })

  if (brevo) {
    try {
      return await sendWithBrevo({ to, subject, text, apiKey: brevo.value })
    } catch (error) {
      await logError('Falló el envío por Brevo', error, { to, subject, nombreVariable: brevo.name })
      throw error
    }
  }

  if (gmail && !onRender) {
    try {
      return await sendWithGmail({ to, subject, text })
    } catch (error) {
      if (!resend) throw error
      await logInfo('Probando Resend porque Gmail falló', { to, subject })
    }
  }

  if (gmail && onRender) {
    await logInfo('Gmail SMTP omitido en Render (puertos bloqueados). Usá BREVO_API_KEY.', { to, subject })
  }

  if (resend) {
    try {
      return await sendWithResend({ to, subject, text, apiKey: resend.value })
    } catch (error) {
      await logError('Falló el envío por Resend', error, { to, subject, nombreVariable: resend.name })
      throw error
    }
  }

  const error = new Error(
    'Configurá BREVO_API_KEY en Render. Gmail SMTP no funciona ahí y Resend sin dominio solo manda a tu mail.',
  )
  await logError('No hay forma de enviar el mail', error, { to, subject, enRender: onRender })
  throw error
}
