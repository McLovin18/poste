// components/RegistrarPosteModal.tsx
"use client";

import { useState } from "react";
import { db, storage } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function RegistroModal({ location, currentUser, onClose, onSaved }: any) {
  const place = location;

  const [nombre, setNombre] = useState("");
  const [idRegistro, setIdRegistro] = useState(() => 'P-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8));
  const [fotos, setFotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleSave = async () => {
    if (!place) {
      alert("No se detectó ubicación");
      return;
    }
    if (!nombre.trim()) {
      alert("Ingresa un nombre para el poste");
      return;
    }

    setLoading(true);

    // Optimistic: crear un objeto local inmediato para mostrar en UI antes
    // de que termine el upload/commit en Firestore.
    const tempId = `temp-${Date.now().toString(36)}`;
    const optimisticPost = {
      id: tempId,
      id_registro: idRegistro,
      nombre,
      lat: place.lat,
      lng: place.lng,
      fotosURLs: [],
      fecha: new Date().toISOString(),
      creadoPorEmail: currentUser?.email || "desconocido",
      creadoPorUid: currentUser?.uid || null,
      creadoPor: currentUser?.uid || null,
      pending: true,
    };

    try {
      if (typeof onSaved === "function") onSaved(optimisticPost);
      const fotosURLs: string[] = [];

      for (const foto of fotos) {
        const safeName = foto.name.replace(/\s+/g, "_");
        const storageRef = ref(storage, `postes/${idRegistro}/${Date.now()}-${safeName}`);
        const metadata = {
          customMetadata: {
            owner: currentUser?.uid || null,
            posteId: idRegistro,
          },
          contentType: foto.type,
        };
        const snapshot = await uploadBytes(storageRef, foto, metadata);
        const url = await getDownloadURL(snapshot.ref);
        fotosURLs.push(url);
      }

      await addDoc(collection(db, "postes"), {
        id_registro: idRegistro,
        nombre,
        lat: place.lat,
        lng: place.lng,
        fotosURLs,
        fecha: serverTimestamp(),
        creadoPorEmail: currentUser?.email || "desconocido",
        creadoPorUid: currentUser?.uid || null,
        creadoPor: currentUser?.uid || null,
      });

      // Guardado en servidor completado. Construir objeto final y notificar al padre
      const finalPost = {
        id: null, // el onSnapshot que corre en el dashboard reemplazará con el id real
        id_registro: idRegistro,
        nombre,
        lat: place.lat,
        lng: place.lng,
        fotosURLs,
        fecha: new Date().toISOString(),
        creadoPorEmail: currentUser?.email || "desconocido",
        creadoPorUid: currentUser?.uid || null,
        creadoPor: currentUser?.uid || null,
        pending: false,
      };

      // guardar también en localStorage fallback para mostrar en recargas
      try {
        const key = "local_postes";
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        existing.unshift(finalPost);
        localStorage.setItem(key, JSON.stringify(existing));
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

        <label className="block mt-4">ID registro:</label>
        <input
          className="w-full border p-2"
          value={idRegistro}
          onChange={(e) => setIdRegistro(e.target.value)}
          autoComplete="off"
        />

        <label className="block mt-4">Nombre del poste:</label>
        <input
          className="w-full border p-2"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          autoComplete="off"
        />

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
