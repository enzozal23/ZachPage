import { Schema, model } from 'mongoose'

const mailLogSchema = new Schema({
  to: { type: [String], default: [] },
  from: { type: String, default: '' },
  subject: { type: String, default: '' },
  text: { type: String, default: '' },
  kind: { type: String, default: 'general', index: true },
  status: { type: String, enum: ['sent', 'failed'], required: true, index: true },
  provider: { type: String, default: '' },
  messageId: { type: String, default: '' },
  error: { type: String, default: '' },
}, { timestamps: true })

mailLogSchema.index({ createdAt: -1 })

export default model('MailLog', mailLogSchema)
