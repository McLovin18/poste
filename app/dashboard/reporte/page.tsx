"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

export default function ReportePage() {
  const { user, loading } = useAuth();
  const [generando, setGenerando] = useState(false);
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setDate(today);
  }, []);

  const descargarReporte = async () => {
    if (!date) {
      alert("Selecciona una fecha para el reporte");
      return;
    }
    setGenerando(true);
    try {
      const res = await fetch(`/api/reporte/daily?date=${encodeURIComponent(date)}`);
      if (!res.ok) throw new Error('Error al generar reporte');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_diario_${date}.pdf`;
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
      <div className="space-y-6 max-w-xl">
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-md p-5 border border-slate-100">
          <h1 className="text-2xl font-bold mb-1 tracking-tight">Reporte diario</h1>
          <p className="text-sm text-gray-600 mb-4">
            Selecciona una fecha para generar el PDF con los activos creados ese día.
          </p>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Fecha del reporte</label>
            <input
              type="date"
              className="w-full md:w-64 border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <button
            onClick={descargarReporte}
            disabled={generando}
            className="mt-5 bg-[#0037A7] hover:bg-[#002b7d] text-white px-4 py-2 rounded-lg w-full md:w-auto text-sm font-medium shadow-sm disabled:opacity-60 transition"
          >
            {generando ? 'Generando...' : 'Descargar reporte (PDF)'}
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
