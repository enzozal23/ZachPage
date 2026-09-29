import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import { logError, logInfo } from './appLog.js'

dotenv.config()

const transport = nodemailer.createTransport({
  service: 'gmail',
  port: 587,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
})

export async function sendMail({ to, subject, text }) {
  const fromUser = process.env.GMAIL_USER || ''
  await logInfo('Enviando mail', {
    to,
    subject,
    fromUser: fromUser || 'GMAIL_USER vacío',
    passwordConfigured: Boolean(process.env.GMAIL_PASS),
  })

  try {
    const result = await transport.sendMail({
      from: 'ZachSuplementos <zachsuplementos@gmail.com>',
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
  } catch (error) {
    await logError('Gmail rechazó el mail', error, { to, subject })
    throw error
  }
}
