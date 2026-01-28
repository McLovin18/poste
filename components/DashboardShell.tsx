"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import ChatWidget from "@/components/ChatWidget";
import ChatControls from "@/components/ChatControls";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOutUser } = useAuth();

  const handleLogout = async () => {
    await signOutUser();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-slate-100 flex flex-col md:flex-row">
      {/* Desktop static sidebar (part of layout) */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-gradient-to-b from-[#0037A7] to-[#001b5c] text-white p-6 shrink-0 shadow-xl">
        <h2 className="text-xl font-bold mb-6 tracking-tight">CNEL - Activos eléctricos</h2>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/dashboard" className="px-3 py-2 rounded-md hover:bg-white/10 transition-colors">Inicio</Link>
          <Link href="/dashboard/postes" className="px-3 py-2 rounded-md hover:bg-white/10 transition-colors">Activos eléctricos</Link>
          <Link href="/dashboard/reporte" className="px-3 py-2 rounded-md hover:bg-white/10 transition-colors">Reporte diario</Link>
        </nav>

        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-md bg-red-600 hover:bg-red-700"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile slide-over Sidebar (keeps existing mobile behaviour) */}
      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main area */}
      <div className="flex-1 min-h-screen flex flex-col relative">
        {/* Topbar only visible on mobile */}
        <div className="md:hidden">
          <Topbar onMenu={() => setMobileOpen(true)} />
        </div>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Barra de chat (notificaciones + lista de trabajadores) y chat general flotante */}
        <ChatControls />
        <ChatWidget />
      </div>
    </div>
  );
}
