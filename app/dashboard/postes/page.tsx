"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "@/lib/auth";
import VerPosteModal from "@/components/VerPosteModal";
import EditPostModal from "../../../components/EditPosteModal";

export default function PostesPage() {
  const { user } = useAuth();
  const [postes, setPostes] = useState<any[]>([]);
  const [qStr, setQStr] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [editSelected, setEditSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPostes = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "postes"));
      const arr: any[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));

      // ordenar por fecha descendente si existe campo fecha y método toMillis
      arr.sort((a, b) => {
        const aTime = a.fecha?.toMillis ? a.fecha.toMillis() : 0;
        const bTime = b.fecha?.toMillis ? b.fecha.toMillis() : 0;
        return bTime - aTime;
      });

      setPostes(arr);
    } catch (err) {
      console.error(err);
      alert("Error al cargar postes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPostes();
  }, []);

  const filtered = postes.filter((p) => {
    const text = `${p.id_registro ?? ""} ${p.nombre ?? ""}`.toLowerCase();
    return text.includes(qStr.toLowerCase());
  });

  const handleDelete = async (p: any) => {
    if (!confirm("¿Eliminar este registro?")) return;
    try {
      await deleteDoc(doc(db, "postes", p.id));
      loadPostes();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar");
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Activos eléctricos</h1>
            <p className="text-sm text-gray-500 mt-1">Listado completo de activos registrados en el sistema.</p>
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-2 bg-white/70 px-3 py-1.5 rounded-full shadow-sm">
            {user?.email}{" "}
            {user?.role && (
              <span className="ml-2 text-xs px-2 py-1 bg-gray-100 rounded">{user.role}</span>
            )}
          </div>
        </div>

        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <input
            value={qStr}
            onChange={(e) => setQStr(e.target.value)}
            placeholder="Buscar por id o nombre"
            className="border border-slate-200 bg-white rounded-lg flex-1 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
          />
          <button
            onClick={loadPostes}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium shadow-sm transition"
          >
            Refrescar
          </button>
        </div>

        {loading ? (
          <p>Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-600">No hay activos eléctricos que mostrar.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <div
                key={p.id ?? p.id_registro ?? Math.random()} // evitar key duplicado o undefined
                className="bg-white/80 backdrop-blur border border-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900">{p.nombre ?? "-"}</p>
                  <p className="text-sm text-gray-600">{p.id_registro ?? "-"}</p>
                  {/* Lat/Lng hidden from UI by request */}
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={() => setSelected(p)}
                    className="px-3 py-1.5 text-xs sm:text-sm rounded-full border border-sky-500 text-sky-600 hover:bg-sky-50 transition"
                  >
                    Ver más
                  </button>

                  {user?.role === "admin" && (
                    <>
                      <button
                        onClick={() => setEditSelected(p)}
                        className="px-3 py-1.5 text-xs sm:text-sm rounded-full bg-amber-400 hover:bg-amber-500 text-black transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="px-3 py-1.5 text-xs sm:text-sm rounded-full bg-red-500 hover:bg-red-600 text-white transition"
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <VerPosteModal poste={selected} onClose={() => setSelected(null)} />
        <EditPostModal
          poste={editSelected}
          onClose={() => {
            setEditSelected(null);
            loadPostes();
          }}
        />
      </div>
    </DashboardShell>
  );
}
