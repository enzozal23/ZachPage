import { Schema, model } from 'mongoose'

const logSchema = new Schema({
  level: { type: String, enum: ['info', 'error'], required: true },
  message: { type: String, required: true },
  detail: { type: Schema.Types.Mixed },
}, { timestamps: true })

export default model('AppLog', logSchema)
