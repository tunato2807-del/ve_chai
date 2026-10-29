import { z } from 'zod'
export const id = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
export const version = z.number().int().min(0).max(2147483647)
export const instant = z.iso.datetime({ offset: true })
export { evidencePathSchema as evidenceUrl } from '../../lib/validation'
export const pageOf = (row) =>
  z.object({
    data: z.array(row),
    page: z.number().int().min(0),
    totalElements: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  })
