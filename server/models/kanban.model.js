import { Schema, model } from 'mongoose'

const boardSchema = new Schema({
  id: String,
  name: String,
  createdAt: String,
}, { _id: false })

const ticketSchema = new Schema({
  id: String,
  boardId: String,
  title: String,
  description: String,
  status: String,
  assignee: String,
  priority: String,
  labels: [String],
  dueDate: String,
  task: String,
  createdAt: String,
  source: String,
  reminderSentFor: String,
}, { _id: false })

const kanbanSchema = new Schema({
  boards: [boardSchema],
  tickets: [ticketSchema],
}, { timestamps: true })

export default model('Kanban', kanbanSchema)
