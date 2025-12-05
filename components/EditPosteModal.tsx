"use client";

import React, { useState } from "react";
import { db, storage } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/lib/auth";

export default function EditPostModal({ poste, onClose }: { poste: any; onClose: () => void }) {
  const [nombre, setNombre] = useState(poste?.nombre || "");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

  if (!poste) return null;
  if (!authLoading && user?.role !== "admin") return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      const fotosURLs = poste.fotosURLs ? [...poste.fotosURLs] : [];

      for (const file of files) {
        const path = `postes/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        fotosURLs.push(url);
      }

      await updateDoc(doc(db, "postes", poste.id), {
        nombre,
        fotosURLs,
      });

      onClose();
    } catch (err) {
      console.error(err);
      alert("Error actualizando");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUrl = async (urlToRemove: string) => {
    if (!confirm('¿Eliminar esta foto del registro?')) return;
    setLoading(true);
    try {
      const fotosURLs = (poste.fotosURLs || []).filter((u: string) => u !== urlToRemove);
      await updateDoc(doc(db, "postes", poste.id), { fotosURLs });
    } catch (e) {
      console.error('No se pudo eliminar la URL:', e);
      alert('Error al eliminar la foto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Editar Poste</h3>
          <button onClick={onClose} className="text-sm text-gray-500">Cerrar</button>
        </div>

        <div className="space-y-3">
          <label className="block text-sm">Nombre</label>
          <input className="w-full border p-2 rounded" value={nombre} onChange={(e) => setNombre(e.target.value)} />

          <label className="block text-sm">Agregar fotos</label>
          <input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files || []))} />

            {poste.fotosURLs && poste.fotosURLs.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {poste.fotosURLs.map((u: string, i: number) => (
                  <div key={i} className="relative">
                    <img src={u} className="w-full h-24 object-cover rounded" />
                    <button onClick={() => handleRemoveUrl(u)} className="absolute top-1 right-1 bg-white/80 text-red-600 rounded px-2 py-1 text-xs">Eliminar</button>
                  </div>
                ))}
              </div>
            )}

          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
              {loading ? "Guardando..." : "Guardar"}
            </button>
            <button onClick={onClose} className="px-4 py-2 border rounded">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
