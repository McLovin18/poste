"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Topbar({ onMenu }: { onMenu?: () => void }) {
  const { signOutUser } = useAuth();

  const handleLogout = async () => {
    await signOutUser();
    // redirect to home/login
    window.location.href = "/";
  };

  return (
    <header className="md:hidden w-full bg-gray-900 text-white px-3 py-2 flex justify-between items-center overflow-hidden">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenu} aria-label="Abrir menú" className="p-2 rounded-md bg-white/10 flex-shrink-0">
          <Menu />
        </button>
        <h2 className="text-lg font-bold truncate flex-1 min-w-0">CNEL — Activos eléctricos</h2>
      </div>

      <div className="hidden sm:flex items-center gap-3">
        <nav className="flex gap-4 text-sm">
          <Link href="/dashboard">Inicio</Link>
          <Link href="/dashboard/postes">Activos</Link>
          <Link href="/dashboard/reporte">Reporte</Link>
        </nav>
      </div>
    </header>
  );
}
