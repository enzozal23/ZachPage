import { z } from 'zod';

export const createTaskSchema = z.object({

    title: z.string({ required_error: 'title is required' }).min(8).max(30),
    description: z.string({ required_error: 'description is required' }).min(8).max(500),
    date: z.string().datetime().optional(),
})