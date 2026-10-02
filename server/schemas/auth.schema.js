import { z } from 'zod'


export const loginSchema = z.object({
    email: z.string({ required_error: 'Email is required' }).email({ required_error: 'invalid email' }),
    password: z.string({ required_error: 'password is required' }).min(1),
})

export const createUserSchema = z.object({
    username: z.string().trim().min(1, 'El nombre es obligatorio'),
    email: z.string().trim().email('El mail no es válido'),
    password: z.string().min(10, 'La contraseña debe tener al menos 10 caracteres'),
    role: z.enum(['admin', 'user']).optional(),
})

export const updateUserSchema = z.object({
    username: z.string().trim().min(1, 'El nombre es obligatorio'),
    email: z.string().trim().email('El mail no es válido'),
    password: z.union([
        z.string().min(10, 'La contraseña debe tener al menos 10 caracteres'),
        z.literal(''),
    ]).optional(),
    currentPassword: z.string().optional(),
    role: z.enum(['admin', 'user']).optional(),
})