import { Schema, model } from 'mongoose'

const sessionLogSchema = new Schema({
  event: { type: String, enum: ['login', 'logout', 'failed'], required: true, index: true },
  email: { type: String, default: '' },
  username: { type: String, default: '' },
  userId: { type: String, default: '' },
  ip: { type: String, default: '' },
  reason: { type: String, default: '' },
}, { timestamps: true })

sessionLogSchema.index({ createdAt: -1 })

export default model('SessionLog', sessionLogSchema)
