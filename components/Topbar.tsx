"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

export default function Topbar({ onMenu }: { onMenu?: () => void }) {
  return (
    <header className="md:hidden w-full bg-gray-900 text-white p-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} className="p-2 rounded-md bg-white/10">
          <Menu />
        </button>
        <h2 className="text-lg font-bold">CNEL Postes</h2>
      </div>

      <nav className="hidden sm:flex gap-4 text-sm">
        <Link href="/dashboard">Inicio</Link>
        <Link href="/dashboard/postes">Postes</Link>
        <Link href="/dashboard/reporte">Reporte</Link>
      </nav>
    </header>
  );
}
