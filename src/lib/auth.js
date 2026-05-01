export function getToken() {
  return localStorage.getItem('ch_token')
}

export function setToken(token) {
  localStorage.setItem('ch_token', token)
}

export function clearToken() {
  localStorage.removeItem('ch_token')
  localStorage.removeItem('ch_user')
}

export function getUser() {
  const u = localStorage.getItem('ch_user')
  return u ? JSON.parse(u) : null
}

export function setUser(user) {
  localStorage.setItem('ch_user', JSON.stringify(user))
}

export function isLoggedIn() {
  return !!getToken()
}
