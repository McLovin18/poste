"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Link from "next/link";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
