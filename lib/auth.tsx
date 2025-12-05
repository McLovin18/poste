"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  AuthError,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

type AppUser = {
  uid: string;
  email: string | null;
  name?: string | null;
  role?: "admin" | "autorizado" | null;
};

type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ ok: boolean; message?: string }>;
  signOutUser: () => Promise<void>;
  refreshUserDoc: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => useContext(AuthContext)!;

// Mapeo de errores
const mapAuthError = (err: any): string => {
  if (err && typeof err === "object" && "code" in err) {
    const authError = err as AuthError;
    switch (authError.code) {
      case "auth/email-already-in-use":
        return "El correo ya está en uso.";
      case "auth/invalid-email":
        return "El formato del correo es inválido.";
      case "auth/weak-password":
        return "La contraseña debe tener al menos 6 caracteres.";
        case "auth/configuration-not-found":
          return "Proveedor de autenticación no configurado en Firebase (habilita Email/Password).";
      case "auth/network-request-failed":
        return "Error de red. Verifica tu conexión.";
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Credenciales inválidas.";
        case "auth/app-not-authorized":
          return "La aplicación no está autorizada para usar este proyecto de Firebase. Verifica las credenciales en .env.local.";
      default:
        return `Error desconocido de Firebase: ${authError.message}`;
    }
  }
  return err?.message || "Ocurrió un error inesperado.";
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar documento del usuario
  const loadUserDoc = async (u: FirebaseUser) => {
    try {
      const docRef = doc(db, "users", u.uid);
      const snap = await getDoc(docRef);
      if (snap && snap.exists()) {
        const data = snap.data();
        setUser({ uid: u.uid, email: data.email ?? u.email ?? null, name: data.name ?? null, role: data.role ?? null });
      } else {
        // Si no existe un documento de usuario, creamos un usuario mínimo por defecto
        setUser({ uid: u.uid, email: u.email ?? null, name: null, role: "autorizado" });
      }
    } catch (err) {
      console.warn("No fue posible leer el documento de usuario:", err);
      setUser({ uid: u.uid, email: u.email ?? null, name: null, role: null });
    }
  };

  // Utilidades de validación/roles basadas en env
  // (Open registration) No hay validación por lista blanca en esta versión inicial.

  // Observador de auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setLoading(true);
      setFirebaseUser(u);

      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Cargar documento de usuario desde Firestore (simple, sin cache complejo)
      await loadUserDoc(u);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Login
  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged se encargará de cargar el user doc
      return { ok: true };
    } catch (err: any) {
      return { ok: false, message: mapAuthError(err) };
    }
  };

  // Registro
  const signUp = async (email: string, password: string, name?: string) => {
    try {
      if (!email || !password) return { ok: false, message: "Email y contraseña son requeridos." };
      if (password.length < 6) return { ok: false, message: "La contraseña debe tener al menos 6 caracteres." };

      // Registro abierto: permitir que cualquier usuario se registre en esta primera versión
        let cred;
        try {
          cred = await createUserWithEmailAndPassword(auth, email, password);
        } catch (e: any) {
          console.error('Error registrando usuario (createUser):', e);
          // Re-map known errors to friendly messages
          return { ok: false, message: mapAuthError(e) };
        }
      const currentUser = cred?.user ?? auth.currentUser;
      if (!currentUser) return { ok: false, message: "Error al inicializar usuario." };

      // Asignar rol por defecto 'autorizado' en el documento de usuario
      const data: AppUser = { uid: currentUser.uid, email, name: name || null, role: "autorizado" };
      try {
        await setDoc(doc(db, "users", currentUser.uid), { ...data, createdAt: new Date().toISOString() });
      } catch (e) {
        console.warn("No se pudo crear user doc inmediatamente (no crítico):", e);
      }
      setUser(data);
      return { ok: true };
    } catch (err: any) {
      console.error("Error registrando usuario:", err);
      return { ok: false, message: mapAuthError(err) };
    }
  };

  // Cerrar sesión
  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      // Clear user state
      setUser(null);
    }
  };

  const refreshUserDoc = async () => {
    if (firebaseUser) {
      await loadUserDoc(firebaseUser);
      return;
    }
    // fallback: si firebaseUser no está listo, intentar con auth.currentUser
    try {
      const cu = auth.currentUser;
      if (cu) await loadUserDoc(cu);
    } catch (err) {
      console.warn('refreshUserDoc fallback falló', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOutUser, refreshUserDoc }}>
      {children}
    </AuthContext.Provider>
  );
};
