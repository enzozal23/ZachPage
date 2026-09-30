import { Schema, model } from 'mongoose'

const activitySchema = new Schema({
  action: {
    type: String,
    enum: ['create', 'update', 'delete'],
    required: true,
    index: true,
  },
  entity: {
    type: String,
    default: 'ticket',
    index: true,
  },
  ticketId: {
    type: String,
    default: '',
    index: true,
  },
  ticketTitle: {
    type: String,
    default: '',
  },
  summary: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    default: '',
  },
  username: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    default: '',
  },
  ip: {
    type: String,
    default: '',
  },
  detail: {
    type: Schema.Types.Mixed,
  },
}, { timestamps: true })

activitySchema.index({ createdAt: -1 })

export default model('ActivityLog', activitySchema)
