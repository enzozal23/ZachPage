import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const transport = nodemailer.createTransport({
  service: 'gmail',
  port: 587,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
})

export function sendMail({ to, subject, text }) {
  return transport.sendMail({
    from: 'ZachSuplementos <zachsuplementos@gmail.com>',
    to,
    subject,
    text,
  })
}
