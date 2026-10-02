import { Schema, model } from 'mongoose'

const boardSchema = new Schema({
  id: String,
  name: String,
  createdAt: String,
  filters: { type: Schema.Types.Mixed, default: undefined },
}, { _id: false })

const taskItemSchema = new Schema({
  id: String,
  text: String,
  done: Boolean,
}, { _id: false })

const commentSchema = new Schema({
  id: String,
  text: String,
  author: String,
  createdAt: String,
}, { _id: false })

const ticketSchema = new Schema({
  id: String,
  boardId: String,
  title: String,
  description: String,
  status: String,
  assignee: String,
  assignees: [String],
  followers: [String],
  priority: String,
  labels: [String],
  dueDate: String,
  expediente: String,
  clientId: String,
  clientName: String,
  task: String,
  tasks: [taskItemSchema],
  createdAt: String,
  source: String,
  importId: String,
  reminderSentFor: String,
  comments: [commentSchema],
}, { _id: false })

const importSchema = new Schema({
  id: String,
  fileName: String,
  boardId: String,
  boardName: String,
  imported: Number,
  skippedNoTitle: Number,
  createdAt: String,
  author: String,
}, { _id: false })

const dueReminderRuleSchema = new Schema({
  status: String,
  priority: String,
  daysBefore: { type: Number, default: 1 },
}, { _id: false })

const settingsSchema = new Schema({
  mailNotificationsEnabled: { type: Boolean, default: true },
  dueReminders: [dueReminderRuleSchema],
}, { _id: false })

const kanbanSchema = new Schema({
  boards: [boardSchema],
  tickets: [ticketSchema],
  imports: [importSchema],
  settings: {
    type: settingsSchema,
    default: () => ({}),
  },
}, { timestamps: true })

export default model('Kanban', kanbanSchema)
