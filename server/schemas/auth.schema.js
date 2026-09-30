import { z } from 'zod'


export const registerSchema = z.object({
    username: z.string({ required_error: 'username is required' }),
    email: z.string({ required_error: 'Email is required' }).email({ required_error: 'invalid email' }),
    password: z.string({ required_error: 'password is required' }).min(6, { required_error: 'password must be at least 6 characters' })
})

export const loginSchema = z.object({
    email: z.string({ required_error: 'Email is required' }).email({ required_error: 'invalid email' }),
    password: z.string({ required_error: 'password is required' }).min(6)
})

export const createUserSchema = z.object({
    username: z.string().trim().min(1, 'El nombre es obligatorio'),
    email: z.string().trim().email('El mail no es válido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const updateUserSchema = z.object({
    username: z.string().trim().min(1, 'El nombre es obligatorio'),
    email: z.string().trim().email('El mail no es válido'),
    password: z.union([
        z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
        z.literal(''),
    ]).optional(),
})