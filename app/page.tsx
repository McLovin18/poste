"use client";

import { useState } from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle, Mail, Lock, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  const handleChange = (field: string, value: string) => setForm({ ...form, [field]: value });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg("");
    setLoading(true);

    try {
      const res = await signIn(form.email, form.password);
      if (!res.ok) throw new Error(res.message || "Error al iniciar sesión.");
      router.push("/dashboard");
    } catch (err: any) {
      setAlertMsg(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-sky-100 p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left: branding / illustration */}
        <div className="hidden md:flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#0037A7] to-[#0053d6] p-8">
          <img src="/logo_cnel.png" alt="Logo CNEL" className="h-20" />
          <h2 className="text-9xl font-semibold">Sistema de Levantamiento de Postes</h2>
          <p className="text-sm max-w-xs text-center">Registra ubicaciones, sube fotos y genera reportes diarios.</p>
          <div className="mt-4 w-full flex items-center justify-center">
          </div>
        </div>

        {/* Right: form */}
        <div className="p-8 md:p-12">
          <h1 className="text-2xl font-bold mb-2">Iniciar sesión</h1>
          <p className="text-sm text-gray-500 mb-6">Ingresa con tu correo y contraseña para acceder al sistema.</p>

          {alertMsg && (
            <div className="flex items-start gap-2 p-3 mb-5 text-sm rounded bg-red-50 border-l-4 border-red-500 text-red-700">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{alertMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Correo</label>
              <div className="relative">
                <Mail size={18} className=" absolute left-5 -translate-y-1/4 text-gray-400" />
                <input
                  type="email"
                  placeholder="usuario@cnel.gob.ec"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full px-4 pl-10 pr-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña</label>
              <div className="relative">
                <Lock size={18} className="py-4 px-10 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="px-4 w-full pl-10 pr-10 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-md font-semibold text-white bg-[#0037A7] hover:bg-[#002f8e] transition-all disabled:opacity-60"
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                <LogIn size={16} />
              )}
              {loading ? "Verificando..." : "Iniciar sesión"}
            </button>
          </form>

          <div className="mt-6 text-sm text-gray-600 flex items-center justify-between">
            <Link href="/auth/register" className="text-sky-600 font-medium">Crear cuenta</Link>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <CheckCircle size={14} className="text-green-500" />
              Conexión segura SSL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
