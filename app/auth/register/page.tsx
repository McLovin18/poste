"use client";

import { useState } from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle, User, Mail, Lock, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { auth } from '@/lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, user: authUser, loading: authLoading, refreshUserDoc } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  const handleChange = (field: string, value: string) =>
    setForm({ ...form, [field]: value });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg("");
    setLoading(true);
    try {
      setAlertMsg('Registrando...');
      const res = await signUp(form.email, form.password, form.name);
      if (!res.ok) {
        setAlertMsg(res.message || 'Error al registrar');
        setLoading(false);
        return;
      }

      // Intentar refrescar user doc y luego redirigir
      try { await refreshUserDoc(); } catch (e) { console.warn('refreshUserDoc falló', e); }
      router.push('/dashboard');
    } catch (err: any) {
      setAlertMsg(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl overflow-hidden bg-white shadow-xl border border-gray-200">
          {/* Header */}
          <div className="p-8 text-center border-b border-gray-100">
            <img src="/logo_cnel.png" alt="Logo CNEL" className="h-24 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">Sistema de Levantamiento de Postes</p>
          </div>

          {/* Formulario */}
          <div className="px-10 py-8">
            {alertMsg && (
              <div className="flex items-start gap-2 p-3 mb-5 text-sm rounded bg-red-50 border-l-4 border-red-500 text-red-700">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{alertMsg}</span>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleRegister}>
              {/* Name */}
              <div className="relative">
                <User size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ej: Carlos Cedeño"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full pl-14 pr-4 py-5 rounded-xl border border-gray-300 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>

              {/* Email */}
              <div className="relative">
                <Mail size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="usuario@cnel.gob.ec"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full pl-14 pr-4 py-5 rounded-xl border border-gray-300 bg-blue-50 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="w-full pl-14 pr-14 py-5 rounded-xl border border-gray-300 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  <UserPlus size={20} />
                )}
                {loading ? "Procesando..." : "Crear cuenta"}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <a href="/" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                Inicia sesión
              </a>
            </div>

            {/* Security */}
            <div className="mt-6 pt-6 border-t border-gray-100 flex justify-center items-center gap-2 text-xs text-gray-500">
              <CheckCircle size={16} className="text-green-500" />
              Conexión segura SSL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
