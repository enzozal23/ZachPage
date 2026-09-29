import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import { logError, logInfo } from './appLog.js'

dotenv.config()

const FROM = 'ZachSuplementos <zachsuplementos@gmail.com>'

function resendCredentials() {
  const named = ['RESEND_API_KEY', 'RESEND_KEY', 'RESEND', 'RESEND_TOKEN', 'API_KEY_RESEND']
  for (const name of named) {
    if (process.env[name]) return { name, value: process.env[name] }
  }
  const fuzzy = Object.keys(process.env).find((key) => /resend/i.test(key) && process.env[key])
  if (fuzzy) return { name: fuzzy, value: process.env[fuzzy] }
  return null
}

const transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
})

async function sendWithResend({ to, subject, text, apiKey }) {
  const from = process.env.MAIL_FROM || 'ZachSuplementos <onboarding@resend.dev>'
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
  await logInfo('Enviando mail por SMTP', {
    to,
    subject,
    host: 'smtp.gmail.com',
    port: 587,
    fromUser: process.env.GMAIL_USER || 'GMAIL_USER vacío',
    passwordConfigured: Boolean(process.env.GMAIL_PASS),
  })

  const result = await transport.sendMail({
    from: FROM,
    to,
    subject,
    text,
  })

  await logInfo('Gmail aceptó el mail', {
    to,
    subject,
    messageId: result.messageId,
    response: result.response,
  })
  return result
}

export async function sendMail({ to, subject, text }) {
  const onRender = Boolean(process.env.RENDER)
  const resend = resendCredentials()

  const pistas = Object.keys(process.env).filter((key) => /resend|mail|gmail/i.test(key))
  await logInfo('Revisando cómo enviar el mail', {
    resendConfigurada: Boolean(resend),
    nombreVariable: resend?.name || 'no encontré ninguna variable con resend',
    variablesParecidas: pistas,
    enRender: onRender,
  })

  if (resend) {
    try {
      return await sendWithResend({ to, subject, text, apiKey: resend.value })
    } catch (error) {
      await logError('Falló el envío por Resend', error, { to, subject, nombreVariable: resend.name })
      throw error
    }
  }

  if (onRender) {
    const error = new Error(
      'La clave de Resend no se encontró. En Render tiene que llamarse RESEND_API_KEY, o el nombre tiene que incluir la palabra resend. El timeout anterior fue Gmail, no Resend.',
    )
    error.code = 'ETIMEDOUT'
    await logError('No se puede usar SMTP en Render', error, { to, subject })
    throw error
  }

  try {
    return await sendWithGmail({ to, subject, text })
  } catch (error) {
    await logError('Gmail no aceptó la conexión', error, { to, subject })
    throw error
  }
}
