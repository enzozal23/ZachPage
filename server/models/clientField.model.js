import { Schema, model } from 'mongoose'

const clientFieldSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  tipo: {
    type: String,
    enum: ['texto', 'numero', 'fecha', 'checkbox', 'selector'],
    required: true,
  },
  orden: {
    type: Number,
    default: 0,
  },
  requerido: {
    type: Boolean,
    default: false,
  },
  opciones: {
    type: [Schema.Types.Mixed],
    default: [],
  },
  clave: {
    type: String,
    default: '',
    trim: true,
  },
}, { timestamps: true })

clientFieldSchema.index(
  { clave: 1 },
  { unique: true, partialFilterExpression: { clave: { $type: 'string', $gt: '' } } },
)

export default model('ClientField', clientFieldSchema)
