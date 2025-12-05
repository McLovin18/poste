"use client";

import GoogleMapComponent from "@/components/GoogleMapComponent";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import DashboardShell from "@/components/DashboardShell";
import { collection, query, where, Timestamp, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [postes, setPostes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleSavedPost = (post: any, replace = false) => {
    setPostes((prev) => {
      if (replace) {
        const filtered = prev.filter((p) => p.id_registro !== post.id_registro && p.id !== post.id);
        return [post, ...filtered];
      }
      if (prev.some((p) => p.id === post.id || p.id_registro === post.id_registro)) return prev;
      return [post, ...prev];
    });
  };

  useEffect(() => {
    if (authLoading || !user) return;

    setLoading(true);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const q = query(
      collection(db, "postes"),
      where("fecha", ">=", Timestamp.fromDate(start)),
      where("fecha", "<=", Timestamp.fromDate(end)),
      orderBy("fecha", "desc")
    );

    // Cargar cached antes del snapshot
    try {
      const cached = JSON.parse(localStorage.getItem("local_postes") || "[]");
      if (Array.isArray(cached) && cached.length) {
        setPostes((prev) => {
          const exists = new Set(prev.map((p) => p.id_registro || p.id));
          const toAdd = cached.filter((c: any) => !exists.has(c.id_registro) && !exists.has(c.id));
          return [...toAdd, ...prev];
        });
      }
    } catch {}

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr: any[] = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));

        try {
          const cached = JSON.parse(localStorage.getItem("local_postes") || "[]");
          if (Array.isArray(cached) && cached.length) {
            const map = new Map();
            // Use id_registro as primary dedupe key when available so optimistic entries
            // (which may not have the final Firestore doc id yet) are merged correctly.
            arr.forEach((s) => {
              const key = s.id_registro ?? s.id ?? s.id_registro;
              map.set(key, s);
            });
            for (const c of cached) {
              const key = c.id_registro ?? c.id ?? c.id_registro;
              if (!map.has(key)) map.set(key, c);
            }
            const merged = Array.from(map.values()).sort(
              (a: any, b: any) =>
                (b.fecha?.seconds || Date.parse(b.fecha || 0)) -
                (a.fecha?.seconds || Date.parse(a.fecha || 0))
            );

            setPostes(merged);
            setLoading(false);
            return;
          }
        } catch {}

        setPostes(arr);
        setLoading(false);
      },
      (err) => {
        console.error("Error cargando postes:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [authLoading, user]);

  if (authLoading) return <p>Cargando sesión...</p>;

  if (!user) {
    router.push("/");
    return <p>Redirigiendo...</p>;
  }

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">

      {/* Título */}
      <h1 className="text-2xl font-bold">Inicio</h1>

      {/* MAPA */}
      <section>
        <div className="bg-white rounded shadow p-4">
          <GoogleMapComponent postes={postes} onSaved={handleSavedPost} />
        </div>
      </section>

      {/* POSTES DE HOY */}
      <section>
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Postes registrados hoy</h2>

          {loading ? (
            <p>Cargando...</p>
          ) : postes.length === 0 ? (
            <p className="text-sm text-gray-600">No hay postes registrados hoy.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {postes.map((p) => (
                <div
                  key={p.id || p.id_registro}
                  className="p-3 border rounded flex items-start gap-3 bg-white"
                >
                  <div className="w-24 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {p.fotosURLs?.[0] ? (
                      <img
                        src={p.fotosURLs[0]}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                        Sin foto
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="font-semibold">{p.nombre || "-"}</div>
                    <div className="text-sm text-gray-500">
                      {p.id_registro || p.id}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(
                        p.fecha?.toDate ? p.fecha.toDate() : p.fecha
                      ).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      className="px-3 py-1 border rounded"
                      onClick={() =>
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }
                    >
                      Ver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      </div>
    </DashboardShell>
  );
}
