"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // IMPORTANT: el valor de NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET debe coincidir exactamente
  // con el bucket que muestra Firebase Console (ej: "sistemaposte.appspot.com" o "sistemaposte.firebasestorage.app")
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId?: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Inicializar app Firebase (cliente)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

// Debug: en desarrollo mostramos la configuración que la app está leyendo
if (process.env.NODE_ENV !== 'production') {
  try {
    // Nota: imprimir solo claves públicas (NEXT_PUBLIC_*)
    // Esto ayuda a verificar que .env.local está cargado correctamente.
    // No mostrar secrets en producción.
    // eslint-disable-next-line no-console
    console.info('[firebase] config (dev):', {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[firebase] error mostrando config', e);
  }
}

// Habilitar persistencia de IndexedDB en el cliente para que los datos queden
// cacheados entre recargas y estén disponibles inmediatamente desde cache.
// Nota: en esta versión de demo no habilitamos persistencia IndexedDB explícita.
// Esto evita mensajes deprecados y evita comportamientos donde la app depende
// de lecturas desde cache en vez de leer desde Firestore en vivo.
