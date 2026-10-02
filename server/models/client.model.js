import { Schema, model } from 'mongoose'

const clientSchema = new Schema({
  tipo: {
    type: String,
    enum: ['fisica', 'juridica'],
    required: true,
  },
  nombre: {
    type: String,
    default: '',
    trim: true,
  },
  apellido: {
    type: String,
    default: '',
    trim: true,
  },
  documento: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  razonSocial: {
    type: String,
    default: '',
    trim: true,
  },
  email: {
    type: String,
    default: '',
    trim: true,
  },
  telefono: {
    type: String,
    default: '',
    trim: true,
  },
  criticidad: {
    type: String,
    enum: ['alta', 'media', 'baja'],
    default: 'media',
  },
  poder: {
    type: Boolean,
    default: false,
  },
  patrocinio: {
    type: Boolean,
    default: false,
  },
  extras: {
    type: Schema.Types.Mixed,
    default: () => ({}),
  },
}, { timestamps: true })

export default model('Client', clientSchema)
