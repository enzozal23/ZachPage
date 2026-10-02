import { Schema, model } from 'mongoose'

const rolePermissionSchema = new Schema({
  role: {
    type: String,
    enum: ['admin', 'user'],
    required: true,
    unique: true,
  },
  permisos: {
    type: [String],
    default: [],
  },
  inicializados: {
    type: [String],
    default: [],
  },
}, { timestamps: true })

export default model('RolePermission', rolePermissionSchema)
