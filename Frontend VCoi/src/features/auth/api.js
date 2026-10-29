import { apiRequest } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { userSchema } from './schemas'

export async function getSession({ signal } = {}) {
  try {
    return parseApi(userSchema, await apiRequest('/api/auth/me', { signal }))
  } catch (error) {
    if (error.status === 401) return null
    throw error
  }
}

export async function signIn(body) {
  return parseApi(userSchema, await apiRequest('/api/auth/login', { method: 'POST', body }), true)
}

export async function registerCustomer(body) {
  return parseApi(
    userSchema.extend({ role: userSchema.shape.role.extract(['CUSTOMER']) }),
    await apiRequest('/api/auth/register', { method: 'POST', body }),
    true,
  )
}

export const signOut = () => apiRequest('/api/auth/logout', { method: 'POST' })
