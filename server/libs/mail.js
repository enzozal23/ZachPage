import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import { logError, logInfo } from './appLog.js'

dotenv.config()

function mailFrom() {
  const user = process.env.GMAIL_USER?.trim()
  if (user) return `Lexora <${user}>`
  return 'Lexora <zachsuplementos@gmail.com>'
}

function resendCredentials() {
  const named = ['RESEND_API_KEY', 'RESEND_KEY', 'RESEND', 'RESEND_TOKEN', 'API_KEY_RESEND']
  for (const name of named) {
    if (process.env[name]) return { name, value: process.env[name] }
  }
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

async function sendWithResend({ to, subject, text, apiKey }) {
  const from = process.env.MAIL_FROM || 'Lexora <onboarding@resend.dev>'
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

  await logInfo('Mail aceptado por HTTPS', { to, subject, id: body.id })
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
        from: mailFrom(),
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
  const resend = resendCredentials()
  const gmail = gmailConfigured()

  const pistas = Object.keys(process.env).filter((key) => /resend|mail|gmail/i.test(key))
  await logInfo('Revisando cómo enviar el mail', {
    gmailConfigurado: gmail,
    resendConfigurada: Boolean(resend),
    nombreVariable: resend?.name || 'no encontré ninguna variable con resend',
    variablesParecidas: pistas,
    enRender: onRender,
  })

  if (gmail) {
    try {
      return await sendWithGmail({ to, subject, text })
    } catch (error) {
      if (!resend) throw error
      await logInfo('Probando Resend porque Gmail falló', {
        to,
        subject,
        motivo: 'Render suele bloquear SMTP (ETIMEDOUT). Resend o un dominio verificado son la vía estable.',
      })
    }
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
    gmail
      ? 'Gmail falló y no hay otra vía de envío configurada.'
      : 'Configurá GMAIL_USER y GMAIL_PASS en Render, o una clave de Resend.',
  )
  await logError('No hay forma de enviar el mail', error, { to, subject, enRender: onRender })
  throw error
}
