import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'

const AUTH_TOKEN_KEY = 'xfy_auth_token'

/**
 * 获取存储的 token
 */
export function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

/**
 * 保存 token
 */
export function saveToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

/**
 * 清除 token
 */
export function clearToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

/**
 * 检查是否已设置密码
 */
export async function hasPassword() {
  const res = await axios.get(`${API_BASE}/auth/has-password`)
  return res.data.hasPassword
}

/**
 * 首次设置密码
 */
export async function setPassword(password) {
  const res = await axios.post(`${API_BASE}/auth/set-password`, { password })
  if (res.data.success && res.data.token) {
    saveToken(res.data.token)
  }
  return res.data
}

/**
 * 登录
 */
export async function login(password) {
  const res = await axios.post(`${API_BASE}/auth/login`, { password })
  if (res.data.success && res.data.token) {
    saveToken(res.data.token)
  }
  return res.data
}

/**
 * 验证当前 token 是否有效
 */
export async function verifyToken() {
  const token = getStoredToken()
  if (!token) return false
  try {
    const res = await axios.post(`${API_BASE}/auth/verify`, { token })
    if (res.data.valid) return true
    clearToken()
    return false
  } catch {
    clearToken()
    return false
  }
}
