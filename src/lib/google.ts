import type { GoogleProfile } from '../store/accounts'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

interface TokenResponse {
  access_token?: string
}

interface GoogleApi {
  accounts: {
    oauth2: {
      initTokenClient: (config: { client_id: string; scope: string; callback: (response: TokenResponse) => void; error_callback: () => void }) => { requestAccessToken: () => void }
    }
  }
}

type GoogleWindow = Window & { google?: GoogleApi }

export const googleConfigured = Boolean(CLIENT_ID)

const loadScript = () =>
  new Promise<GoogleApi>((resolve, reject) => {
    const existing = (window as GoogleWindow).google
    if (existing?.accounts) {
      resolve(existing)
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve((window as GoogleWindow).google!)
    script.onerror = () => reject(new Error('Google sign-in could not load. Check your connection.'))
    document.head.appendChild(script)
  })

export const requestGoogleProfile = async (): Promise<GoogleProfile> => {
  const google = await loadScript()
  const token = await new Promise<string>((resolve, reject) => {
    google.accounts.oauth2
      .initTokenClient({
        client_id: CLIENT_ID!,
        scope: 'openid email profile',
        callback: response => (response.access_token ? resolve(response.access_token) : reject(new Error('Google sign-in was cancelled.'))),
        error_callback: () => reject(new Error('Google sign-in was cancelled.'))
      })
      .requestAccessToken()
  })
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error('Google did not share your details. Try again.')
  const info = (await response.json()) as { email?: string; email_verified?: boolean; name?: string; picture?: string }
  if (!info.email || info.email_verified === false) throw new Error('Your Google email is not verified.')
  return { email: info.email, name: info.name ?? '', picture: info.picture ?? null }
}
