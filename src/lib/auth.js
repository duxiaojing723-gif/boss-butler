const STORAGE_KEY = 'boss-butler-auth'
const CREDENTIALS = { username: 'shansixiao', password: '888888' }

export function isLoggedIn() {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

export function login(username, password) {
  if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
    localStorage.setItem(STORAGE_KEY, 'true')
    return true
  }
  return false
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY)
}
