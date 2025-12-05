"use client";

import { useState } from "react";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Sidebar and topbar moved to individual pages to allow per-page control */}

      {/* Contenido principal (sin reservar espacio para sidebar; cada página lo hará) */}
      <main className="min-h-screen bg-gray-100 p-4 md:p-6 relative">
        <div className="w-full">
          {children}
        </div>
      </main>

    </div>
  );
}
