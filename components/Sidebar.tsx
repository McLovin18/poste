"use client";
import Link from "next/link";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Sidebar({
  isOpen = true,
  onClose
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const { signOutUser } = useAuth();

  const handleLogout = async () => {
    if (onClose) onClose();
    await signOutUser();
    window.location.href = "/";
  };
  return (
    <>
      {/* Mobile sidebar ONLY */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>

        <div className="relative w-64 h-full bg-gradient-to-b from-[#0037A7] to-[#001b5c] text-white p-4 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">CNEL - Activos eléctricos</h2>
            <button onClick={onClose}><X /></button>
          </div>

          <nav className="flex flex-col gap-2 mt-2 text-sm">
            <Link
              href="/dashboard"
              onClick={onClose}
              className="px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
            >
              Inicio
            </Link>
            <Link
              href="/dashboard/postes"
              onClick={onClose}
              className="px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
            >
              Activos
            </Link>
            <Link
              href="/dashboard/reporte"
              onClick={onClose}
              className="px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
            >
              Reporte diario
            </Link>
          </nav>
          <div className="mt-6">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-md bg-red-600 hover:bg-red-700"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
