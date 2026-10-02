import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import MailLog from '../models/mailLog.model.js'
import { logError } from './appLog.js'

dotenv.config()

const FROM = process.env.MAIL_FROM || `Lexora <${process.env.GMAIL_USER || 'zachsuplementos@gmail.com'}>`

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

function recipientsOf(to) {
  const list = Array.isArray(to) ? to : [to]
  return list.map((item) => String(item || '').trim()).filter(Boolean)
}

async function recordMail(entry) {
  try {
    await MailLog.create({
      ...entry,
      text: String(entry.text || '').slice(0, 8000),
    })
  } catch (error) {
    console.error('[mail-log] no se pudo guardar', error.message)
  }
}

async function sendWithResend({ to, subject, text, apiKey }) {
  const from = process.env.MAIL_FROM || 'ZachSuplementos <onboarding@resend.dev>'
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
    throw error
  }

  return { from, messageId: body.id || '', raw: body }
}

async function sendWithGmail({ to, subject, text }) {
  const result = await transport.sendMail({
    from: FROM,
    to,
    subject,
    text,
  })
  return { from: FROM, messageId: result.messageId || '', raw: result }
}

export async function sendMail({ to, subject, text, kind = 'general' }) {
  const recipients = recipientsOf(to)
  const base = {
    to: recipients,
    subject: String(subject || ''),
    text: String(text || ''),
    kind: String(kind || 'general'),
  }
  const onRender = Boolean(process.env.RENDER)
  const resend = resendCredentials()

  if (resend) {
    const from = process.env.MAIL_FROM || 'Lexora <onboarding@resend.dev>'
    try {
      const result = await sendWithResend({ to: recipients, subject: base.subject, text: base.text, apiKey: resend.value })
      await recordMail({ ...base, from: result.from, status: 'sent', provider: 'resend', messageId: result.messageId })
      return result.raw
    } catch (error) {
      await recordMail({ ...base, from, status: 'failed', provider: 'resend', error: error.message || 'No se pudo enviar' })
      await logError('Falló el envío por Resend', error, { to: recipients, subject: base.subject })
      throw error
    }
  }

  if (onRender) {
    const error = new Error('La clave de Resend no se encontró en el servidor.')
    await recordMail({ ...base, from: FROM, status: 'failed', provider: 'resend', error: error.message })
    await logError('No se puede usar SMTP en Render', error, { to: recipients, subject: base.subject })
    throw error
  }

  try {
    const result = await sendWithGmail({ to: recipients, subject: base.subject, text: base.text })
    await recordMail({ ...base, from: result.from, status: 'sent', provider: 'gmail', messageId: result.messageId })
    return result.raw
  } catch (error) {
    await recordMail({ ...base, from: FROM, status: 'failed', provider: 'gmail', error: error.message || 'No se pudo enviar' })
    await logError('Gmail no aceptó la conexión', error, { to: recipients, subject: base.subject })
    throw error
  }
}
