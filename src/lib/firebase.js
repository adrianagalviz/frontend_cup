import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { firebaseConfig, firebaseConfigurado } from '../config/firebase.config'

function obtenerFirebaseApp() {
  if (!firebaseConfigurado()) {
    throw new Error('Firebase no esta configurado. Revisa VITE_FIREBASE_API_KEY y VITE_FIREBASE_AUTH_DOMAIN.')
  }

  return getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
}

export async function obtenerTokenGoogleFirebase() {
  const auth = getAuth(obtenerFirebaseApp())
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })

  const resultado = await signInWithPopup(auth, provider)
  return resultado.user.getIdToken()
}

export async function cerrarSesionFirebase() {
  if (!firebaseConfigurado() || !getApps().length) return

  await signOut(getAuth(getApps()[0]))
}

