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

  const canonicalFor = (o: any) => {
    if (!o) return null;
    if (o.id_registro) return `r:${o.id_registro}`;
    if (o.id) return `i:${o.id}`;
    if (o.geometry) {
      try {
        const type = o.geometry.type || 'geometry';
        const coords = (o.geometry.coordinates || [])
          .map((c: any) => {
            if (Array.isArray(c)) return `${Number(c[1] ?? c[0]).toFixed(6)},${Number(c[0] ?? c[1]).toFixed(6)}`;
            if (typeof c === 'object') return `${Number(c.lat ?? c.latitude ?? 0).toFixed(6)},${Number(c.lng ?? c.longitude ?? 0).toFixed(6)}`;
            return String(c);
          })
          .join(';');
        return `g:${type}:${coords}`;
      } catch (e) {
        return `g:${JSON.stringify(o.geometry)}`;
      }
    }
    if (typeof o.lat === 'number' && typeof o.lng === 'number') return `p:${o.lat.toFixed(6)},${o.lng.toFixed(6)}`;
    return `t:${(o.nombre||'').toString().slice(0,30)}:${o.fecha || ''}`;
  };

  const handleSavedPost = (post: any, replace = false) => {
    setPostes((prev) => {
      const key = canonicalFor(post);
      if (replace) {
        const filtered = prev.filter((p) => canonicalFor(p) !== key);
        return [post, ...filtered];
      }
      if (prev.some((p) => canonicalFor(p) === key)) return prev;
      return [post, ...prev];
    });
  };

  useEffect(() => {
    if (authLoading || !user) return;

    setLoading(true);

    // Para el mapa queremos ver todos los postes, sin filtrar por fecha.
    // El filtrado "de hoy" solo se aplicará en la sección de "Registros hoy".
    const q = query(
      collection(db, "postes"),
      orderBy("fecha", "desc")
    );

    // Cargar cached antes del snapshot (desactivado por simplicidad: usamos solo Firestore)
    try {
      const cached = JSON.parse(localStorage.getItem("local_postes") || "[]");
      if (false && Array.isArray(cached) && cached.length) {
        const canonicalFor = (o: any) => {
          if (!o) return null;
          if (o.id_registro) return `r:${o.id_registro}`;
          if (o.id) return `i:${o.id}`;
          if (o.geometry) {
            try {
              const type = o.geometry.type || 'geometry';
              const coords = (o.geometry.coordinates || [])
                .map((c: any) => {
                  if (Array.isArray(c)) return `${Number(c[1] ?? c[0]).toFixed(6)},${Number(c[0] ?? c[1]).toFixed(6)}`;
                  if (typeof c === 'object') return `${Number(c.lat ?? c.latitude ?? 0).toFixed(6)},${Number(c.lng ?? c.longitude ?? 0).toFixed(6)}`;
                  return String(c);
                })
                .join(';');
              return `g:${type}:${coords}`;
            } catch (e) {
              return `g:${JSON.stringify(o.geometry)}`;
            }
          }
          if (typeof o.lat === 'number' && typeof o.lng === 'number') return `p:${o.lat.toFixed(6)},${o.lng.toFixed(6)}`;
          return `t:${(o.nombre||'').toString().slice(0,30)}:${o.fecha || ''}`;
        };

        setPostes((prev) => {
          const seen = new Set(prev.map((p) => canonicalFor(p)));
          const toAdd = cached.filter((c: any) => !seen.has(canonicalFor(c)));
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
          if (false && Array.isArray(cached) && cached.length) {
            const map = new Map<string, any>();

            const normalizeGeometryString = (geom: any) => {
              if (!geom) return null;
              const type = geom.type || 'geometry';

              let coordsArray: any[] = [];
              // geometry may be stored as GeoJSON { type, coordinates }
              if (geom.coordinates) {
                // Polygon: coordinates might be [ [ [lng,lat], ... ] ]
                if (geom.type === 'Polygon') {
                  if (Array.isArray(geom.coordinates[0]) && Array.isArray(geom.coordinates[0][0])) {
                    coordsArray = geom.coordinates[0];
                  } else {
                    coordsArray = geom.coordinates[0] || geom.coordinates;
                  }
                } else {
                  coordsArray = geom.coordinates;
                }
              } else if (Array.isArray(geom)) {
                coordsArray = geom;
              } else if (geom.lat !== undefined && geom.lng !== undefined) {
                coordsArray = [ { lat: geom.lat, lng: geom.lng } ];
              } else {
                // unknown shape, fallback to string
                return JSON.stringify(geom);
              }

              const pts = coordsArray.map((c: any) => {
                if (Array.isArray(c)) {
                  // Treat arrays as [lng, lat] (GeoJSON standard). Use fallbacks if missing.
                  const lng = Number(c[0] ?? c[1] ?? 0);
                  const lat = Number(c[1] ?? c[0] ?? 0);
                  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
                }
                if (typeof c === 'object') {
                  const lat = Number(c.lat ?? c.latitude ?? c[1] ?? 0);
                  const lng = Number(c.lng ?? c.longitude ?? c[0] ?? 0);
                  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
                }
                return String(c);
              }).join(";");

              return `${type}:${pts}`;
            };

            const makeKey = (o: any) => {
              if (!o) return `tmp:undefined`;
              if (o.id_registro) return `r:${o.id_registro}`;
              if (o.id) return `i:${o.id}`;
              if (o.geometry) {
                const g = normalizeGeometryString(o.geometry);
                return `g:${g}`;
              }
              if (typeof o.lat === 'number' && typeof o.lng === 'number') return `p:${o.lat.toFixed(6)},${o.lng.toFixed(6)}`;
              return `tmp:${o.nombre || ''}:${o.fecha?.seconds || o.fecha || Math.random()}`;
            };

            // Insertar manteniendo el más reciente para cada key.
            // El snapshot ya viene ordenado por fecha desc, así que
            // la primera vez que vemos una key debe ser el registro más nuevo.
            arr.forEach((s) => {
              const key = makeKey(s);
              if (!key) return;
              if (!map.has(key)) {
                map.set(key, s);
              }
            });
            for (const c of cached) {
              const key = makeKey(c);
              if (!map.has(key)) map.set(key, c);
            }

            const merged = Array.from(map.values()).sort(
              (a: any, b: any) =>
                (b.fecha?.seconds || Date.parse(b.fecha || 0)) -
                (a.fecha?.seconds || Date.parse(a.fecha || 0))
            );

            // Post-process merged array to remove near-duplicates using normalized geometry
            const canonical = (o: any) => {
              if (!o) return null;
              if (o.id_registro) return `r:${o.id_registro}`;
              if (o.id) return `i:${o.id}`;
              if (o.geometry) {
                try {
                  return `g:${normalizeGeometryString(o.geometry)}`;
                } catch (e) {
                  return `g:${JSON.stringify(o.geometry)}`;
                }
              }
              if (typeof o.lat === 'number' && typeof o.lng === 'number') return `p:${o.lat.toFixed(6)},${o.lng.toFixed(6)}`;
              const time = o.fecha?.seconds || (o.fecha ? Date.parse(o.fecha) : 0);
              return `t:${(o.nombre||'').toString().slice(0,30)}:${time}`;
            };

            // Additional proximity-based dedupe to catch slight format differences
            const isTemp = (o: any) => typeof o.id === 'string' && o.id.startsWith('temp-');

            const firstLatLng = (o: any) => {
              try {
                if (!o) return null;
                if (o.geometry && o.geometry.coordinates) {
                  let coords = o.geometry.coordinates;
                  if (o.geometry.type === 'Polygon') {
                    // take first ring
                    if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) coords = coords[0];
                    else coords = coords[0] || coords;
                  }
                  const first = coords[0];
                  if (!first) return null;
                  if (Array.isArray(first)) {
                    const lng = Number(first[0] ?? first[1] ?? 0);
                    const lat = Number(first[1] ?? first[0] ?? 0);
                    return { lat, lng };
                  }
                  if (typeof first === 'object') {
                    const lat = Number(first.lat ?? first.latitude ?? first[1] ?? 0);
                    const lng = Number(first.lng ?? first.longitude ?? first[0] ?? 0);
                    return { lat, lng };
                  }
                  return null;
                }
                if (typeof o.lat === 'number' && typeof o.lng === 'number') return { lat: o.lat, lng: o.lng };
                return null;
              } catch (e) { return null; }
            };

            const threshold = 0.0002; // ~20m tolerance
            const kept: any[] = [];

            for (const item of merged) {
              const c = firstLatLng(item);
              let matched = false;
              if (c) {
                for (let i = 0; i < kept.length; i++) {
                  const k = kept[i];
                  const kc = firstLatLng(k);
                  if (!kc) continue;
                  if ((item.tipo || 'poste') !== (k.tipo || 'poste')) continue;
                  const dlat = Math.abs(c.lat - kc.lat);
                  const dlng = Math.abs(c.lng - kc.lng);
                  if (dlat < threshold && dlng < threshold) {
                    // same place: prefer non-temp over temp
                    if (isTemp(k) && !isTemp(item)) {
                      kept[i] = item;
                    }
                    matched = true;
                    break;
                  }
                }
              }
              if (!matched) kept.push(item);
            }

            // final canonical pass to remove exact duplicates
            const seen = new Set<string>();
            const final: any[] = [];
            for (const item of kept) {
              const key = canonical(item);
              if (!key) continue;
              if (seen.has(key)) continue;
              seen.add(key);
              final.push(item);
            }

            setPostes(final);
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

  // Filtrar solo los registros creados hoy para la sección "Registros hoy"
  const todayStart = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const todayEnd = (() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  })();

  const registrosHoy = postes.filter((p) => {
    try {
      const fechaRaw = p?.fecha?.toDate ? p.fecha.toDate() : (p?.fecha ? new Date(p.fecha) : null);
      if (!fechaRaw || isNaN(fechaRaw.getTime())) return false;
      return fechaRaw >= todayStart && fechaRaw <= todayEnd;
    } catch {
      return false;
    }
  });

  if (authLoading) return <p>Cargando sesión...</p>;

  if (!user) {
    router.push("/");
    return <p>Redirigiendo...</p>;
  }

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">

        {/* Título */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inicio</h1>
            <p className="text-sm text-gray-500 mt-1">Mapa de activos y registros creados hoy.</p>
          </div>
        </div>

        {/* MAPA */}
        <section>
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-md p-3 md:p-4 border border-slate-100">
            <GoogleMapComponent postes={postes} onSaved={handleSavedPost} />
          </div>
        </section>

        {/* REGISTROS DE HOY */}
        <section>
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-md p-4 border border-slate-100">
            <h2 className="text-lg font-semibold mb-3">Registros hoy</h2>

            {loading ? (
              <p className="text-sm text-gray-600">Cargando...</p>
            ) : registrosHoy.length === 0 ? (
              <p className="text-sm text-gray-600">No hay registros hoy.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {registrosHoy.map((p) => (
                  <div
                    key={(p.id || p.id_registro || JSON.stringify(p.geometry) || JSON.stringify(p)).toString()}
                    className="p-3 border border-slate-100 rounded-xl flex items-start gap-3 bg-white hover:shadow-md transition"
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-semibold text-slate-900">{p.nombre || "-"}</div>
                        <div className="text-xs text-gray-600 px-2 py-0.5 rounded-full bg-slate-100">{
                          (p.tipo === 'poste' ? 'Poste' : p.tipo === 'linea' ? 'Línea' : p.tipo === 'poligono' ? 'Polígono' : 'Elemento')
                        }</div>
                      </div>
                      <div className="text-sm text-gray-500">{p.id_registro || p.id}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(
                          p.fecha?.toDate ? p.fecha.toDate() : p.fecha
                        ).toLocaleString()}</div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        className="px-3 py-1.5 text-xs rounded-full border border-sky-500 text-sky-600 hover:bg-sky-50 transition"
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
