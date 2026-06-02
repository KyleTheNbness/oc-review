const TOKEN_KEY = 'oc_user_token'

export function getUserToken(): string {
  if (typeof window === 'undefined') return ''
  let token = localStorage.getItem(TOKEN_KEY)
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem(TOKEN_KEY, token)
  }
  return token
}
