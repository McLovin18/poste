// components/RegistrarPosteModal.tsx
"use client";

import { useState } from "react";
import { db, storage } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, runTransaction } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function RegistroModal({ location, currentUser, onClose, onSaved }: any) {
  const place = location; // for poste: {lat,lng} ; for linea/poligono: Array<{lat,lng}>

  const isArrayPlace = Array.isArray(place);

  const [nombre, setNombre] = useState("");
  const [idRegistro, setIdRegistro] = useState("");
  const [tipoEntidad, setTipoEntidad] = useState<'poste' | 'linea' | 'poligono'>(
    isArrayPlace ? (place.length >= 3 ? 'poligono' : 'linea') : 'poste'
  );
  const [tipoLinea, setTipoLinea] = useState<string>('tramo de media tension aereo');
  const [tipoPoligono, setTipoPoligono] = useState<string>('area servicio');
  const [fotos, setFotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleSave = async () => {
    if (!place || (isArrayPlace && (place as any[]).length === 0)) {
      alert("No se detectó ubicación");
      return;
    }
    if (!nombre.trim()) {
      alert("Ingresa un nombre para el poste");
      return;
    }

    setLoading(true);
    // Si es un poste, obtener siguiente número secuencial desde Firestore (atomically)
    try {
      let usedId = idRegistro;
      if (tipoEntidad === 'poste' && !idRegistro) {
        const nextNum = await runTransaction(db, async (transaction) => {
          const counterRef = doc(db, 'counters', 'postes');
          const counterSnap = await transaction.get(counterRef);
          if (!counterSnap.exists()) {
            transaction.set(counterRef, { last: 1 });
            return 1;
          }
          const last = counterSnap.data()?.last || 0;
          const next = last + 1;
          transaction.update(counterRef, { last: next });
          return next;
        });

        const formatted = 'P' + String(nextNum).padStart(6, '0');
        setIdRegistro(formatted);
        usedId = formatted;
      }

      // Validaciones según tipo
      if (tipoEntidad === 'poste') {
        if (typeof (place as any).lat !== 'number' || typeof (place as any).lng !== 'number') {
          alert('Ubicación inválida para poste.');
          setLoading(false);
          return;
        }
      } else if (tipoEntidad === 'linea') {
        if (!Array.isArray(place) || (place as any[]).length < 2) {
          alert('Una línea requiere al menos 2 puntos en el mapa.');
          setLoading(false);
          return;
        }
      } else if (tipoEntidad === 'poligono') {
        if (!Array.isArray(place) || (place as any[]).length < 3) {
          alert('Un polígono requiere al menos 3 puntos en el mapa.');
          setLoading(false);
          return;
        }
      }

      // Optimistic: crear un objeto local inmediato para mostrar en UI antes
      // de que termine el upload/commit en Firestore.
      const tempId = `temp-${Date.now().toString(36)}`;
      const optimisticPost: any = {
        id: tempId,
        id_registro: usedId || null,
        nombre,
        fotosURLs: [],
        fecha: new Date().toISOString(),
        creadoPorEmail: currentUser?.email || "desconocido",
        creadoPorUid: currentUser?.uid || null,
        creadoPor: currentUser?.uid || null,
        pending: true,
        tipo: tipoEntidad,
      };

      if (tipoEntidad === 'poste') {
        optimisticPost.lat = place.lat;
        optimisticPost.lng = place.lng;
      } else if (tipoEntidad === 'linea') {
        optimisticPost.geometry = { type: 'LineString', coordinates: place || [] };
        optimisticPost.subtipo = tipoLinea;
      } else if (tipoEntidad === 'poligono') {
        optimisticPost.geometry = { type: 'Polygon', coordinates: place || [] };
        optimisticPost.subtipo = tipoPoligono;
      }

      if (typeof onSaved === "function") onSaved(optimisticPost);
      const fotosURLs: string[] = [];

      for (const foto of fotos) {
        const safeName = foto.name.replace(/\s+/g, "_");
        const basePath = (usedId as string) || `entity-${Date.now().toString(36)}`;
        const storageRef = ref(storage, `postes/${basePath}/${Date.now()}-${safeName}`);
        const metadata = {
          customMetadata: {
            owner: String(currentUser?.uid || ""),
            posteId: String((usedId as string) || ""),
          },
          contentType: foto.type,
        };
        const snapshot = await uploadBytes(storageRef, foto, metadata);
        const url = await getDownloadURL(snapshot.ref);
        fotosURLs.push(url);
      }

      // Construir el documento según el tipo de entidad
      const docData: any = {
        nombre,
        fotosURLs,
        fecha: serverTimestamp(),
        creadoPorEmail: currentUser?.email || "desconocido",
        creadoPorUid: currentUser?.uid || null,
        creadoPor: currentUser?.uid || null,
        tipo: tipoEntidad,
      };

      if (tipoEntidad === 'poste') {
        docData.id_registro = usedId;
        docData.lat = place.lat;
        docData.lng = place.lng;
      } else if (tipoEntidad === 'linea') {
        docData.geometry = { type: 'LineString', coordinates: place || [] };
        docData.subtipo = tipoLinea;
      } else if (tipoEntidad === 'poligono') {
        docData.geometry = { type: 'Polygon', coordinates: place || [] };
        docData.subtipo = tipoPoligono;
      }

      await addDoc(collection(db, "postes"), docData);

      // Guardado en servidor completado. Construir objeto final y notificar al padre
      const finalPost: any = {
        id: tempId, // keep temp id locally until snapshot provides real doc id
        id_registro: usedId || null,
        nombre,
        fotosURLs,
        fecha: new Date().toISOString(),
        creadoPorEmail: currentUser?.email || "desconocido",
        creadoPorUid: currentUser?.uid || null,
        creadoPor: currentUser?.uid || null,
        pending: false,
        tipo: tipoEntidad,
      };

      if (tipoEntidad === 'poste') {
        finalPost.lat = place.lat;
        finalPost.lng = place.lng;
      } else {
        finalPost.geometry = { type: tipoEntidad === 'linea' ? 'LineString' : 'Polygon', coordinates: place || [] };
        finalPost.subtipo = tipoEntidad === 'linea' ? tipoLinea : tipoPoligono;
      }

      // guardar también en localStorage fallback para mostrar en recargas
      try {
        const key = "local_postes";
        const existing = JSON.parse(localStorage.getItem(key) || "[]");

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

        const finalKey = canonicalFor(finalPost);
        const deduped = Array.isArray(existing)
          ? existing.filter((e: any) => canonicalFor(e) !== finalKey)
          : [];
        deduped.unshift(finalPost);
        localStorage.setItem(key, JSON.stringify(deduped));
      } catch (e) {
        console.warn('No se pudo escribir local_postes en localStorage', e);
      }

      if (typeof onSaved === "function") onSaved(finalPost, true);

      onClose();
    } catch (err: any) {
      console.error("Error guardando poste:", err);
      alert("Hubo un error guardando el registro. Revisa consola.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md">
        <h2 className="text-xl font-bold">Registrar nuevo poste</h2>
        <label className="block mt-4">Tipo de entidad:</label>
        <select className="w-full border p-2" value={tipoEntidad} onChange={(e) => setTipoEntidad(e.target.value as any)}>
          <option value="poste">Poste (P...)</option>
          <option value="linea">Línea (tramo)</option>
          <option value="poligono">Polígono (área)</option>
        </select>

        <label className="block mt-4">ID registro:</label>
        <input
          className="w-full border p-2"
          value={idRegistro}
          onChange={(e) => setIdRegistro(e.target.value)}
          autoComplete="off"
        />

        <label className="block mt-4">Nombre:</label>
        <input
          className="w-full border p-2"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          autoComplete="off"
        />

        {tipoEntidad === 'linea' && (
          <>
            <label className="block mt-4">Tipo de línea:</label>
            <select className="w-full border p-2" value={tipoLinea} onChange={(e) => setTipoLinea(e.target.value)}>
              <option>tramo de media tension aereo</option>
              <option>tramo de media tension soterrado</option>
              <option>tramo de baja tension aereo</option>
              <option>tramo de baja tension soterrado</option>
              <option>tramo de subtransmision aereo</option>
              <option>tramo de subtransmision soterrado</option>
              <option>tramo operador aereo</option>
            </select>
          </>
        )}

        {tipoEntidad === 'poligono' && (
          <>
            <label className="block mt-4">Tipo de polígono (uso):</label>
            <input className="w-full border p-2" value={tipoPoligono} onChange={(e) => setTipoPoligono(e.target.value)} />
          </>
        )}

        <label className="block mt-4">Fotos:</label>
        <input type="file" multiple accept="image/*" onChange={(e) => {
          const files = Array.from(e.target.files || []);
          setFotos(files);
          try {
            const urls = files.map((f) => URL.createObjectURL(f));
            setPreviews(urls);
          } catch (e) { setPreviews([]); }
        }} />

        {previews.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {previews.map((p, i) => (
              <div key={i} className="w-full h-20 overflow-hidden rounded bg-gray-100">
                <img src={p} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-[#0037A7] text-white w-full py-2 rounded-lg"
          >
            {loading ? "Guardando..." : "Completar registro"}
          </button>

          <button onClick={onClose} className="w-full mt-2 py-2 border rounded-lg">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
