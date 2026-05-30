export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
}

export function firebaseConfigurado() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain)
}
