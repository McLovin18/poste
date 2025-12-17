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
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Activos eléctricos</h1>
          <div className="text-sm text-gray-600">
            {user?.email}{" "}
            {user?.role && (
              <span className="ml-2 text-xs px-2 py-1 bg-gray-100 rounded">{user.role}</span>
            )}
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          <input
            value={qStr}
            onChange={(e) => setQStr(e.target.value)}
            placeholder="Buscar por id o nombre"
            className="border p-2 rounded flex-1"
          />
          <button onClick={loadPostes} className="px-3 py-2 bg-gray-200 rounded">
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
                className="bg-white p-3 rounded shadow flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold">{p.nombre ?? "-"}</p>
                  <p className="text-sm text-gray-600">{p.id_registro ?? "-"}</p>
                  {/* Lat/Lng hidden from UI by request */}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setSelected(p)} className="px-3 py-1 border rounded">
                    Ver más
                  </button>

                  {user?.role === "admin" && (
                    <>
                      <button
                        onClick={() => setEditSelected(p)}
                        className="px-3 py-1 bg-yellow-500 text-black rounded"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="px-3 py-1 bg-red-500 text-white rounded"
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
