"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

export default function ReportePage() {
  const { user, loading } = useAuth();
  const [generando, setGenerando] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const descargarReporte = async () => {
    setGenerando(true);
    try {
      const res = await fetch('/api/reporte/daily');
      if (!res.ok) throw new Error('Error al generar reporte');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_diario_${new Date().toISOString().slice(0,10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error generando reporte. Revisa la consola.');
    } finally {
      setGenerando(false);
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (!user) return <p>No autorizado. Inicia sesión.</p>;

  return (
    <DashboardShell>
      <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Reporte diario</h1>
      <p className="mb-4">Descargar un PDF con los levantamientos realizados hoy.</p>

      <button onClick={descargarReporte} disabled={generando} className="bg-[#0037A7] text-white px-4 py-2 rounded">
        {generando ? 'Generando...' : 'Descargar reporte diario (PDF)'}
      </button>
      </div>
    </DashboardShell>
  );
}
