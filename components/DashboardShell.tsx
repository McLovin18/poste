"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOutUser } = useAuth();

  const handleLogout = async () => {
    await signOutUser();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Desktop static sidebar (part of layout) */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-gray-900 text-white p-4">
        <h2 className="text-xl font-bold mb-6">CNEL - Postes</h2>
        <nav className="flex flex-col gap-4">
          <Link href="/dashboard" className="hover:text-yellow-300">Inicio</Link>
          <Link href="/dashboard/postes" className="hover:text-yellow-300">Postes</Link>
          <Link href="/dashboard/reporte" className="hover:text-yellow-300">Reporte diario</Link>
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
      <div className="flex-1 min-h-screen">
        {/* Topbar only visible on mobile */}
        <div className="md:hidden">
          <Topbar onMenu={() => setMobileOpen(true)} />
        </div>

        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
