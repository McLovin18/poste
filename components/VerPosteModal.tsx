"use client";

import React from "react";
import { useAuth } from "@/lib/auth";

export default function VerPosteModal({ poste, onClose, onEdit }: { poste: any; onClose: () => void; onEdit?: (p: any) => void }) {
  const { user } = useAuth();
  if (!poste) return null;

  const humanType = poste.tipo === 'poste' ? 'Poste' : poste.tipo === 'linea' ? 'Línea' : poste.tipo === 'poligono' ? 'Polígono' : 'Elemento eléctrico';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl overflow-auto max-h-[90vh]">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Detalle - {humanType}</h3>
          <button onClick={onClose} className="text-sm text-gray-500">Cerrar</button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-semibold">Nombre: {poste.nombre}</p>
            <p className="text-sm text-gray-600">ID: {poste.id_registro || poste.id}</p>
            {poste.geometry && (
              <div className="text-sm text-gray-600 mt-2">
                <p className="font-semibold">Geometría: {poste.geometry.type}</p>
                <p>Puntos: {(poste.geometry.coordinates && poste.geometry.coordinates.length) || 0}</p>
                {poste.tipo === 'linea' && poste.subtipo && (
                  <p className="text-sm text-gray-700 mt-1">Tipo de línea: {poste.subtipo}</p>
                )}
                {poste.tipo === 'poligono' && poste.subtipo && (
                  <p className="text-sm text-gray-700 mt-1">Tipo de polígono: {poste.subtipo}</p>
                )}
              </div>
            )}

            <p className="text-sm mt-2">Creado por: {user?.email || user?.name || 'Desconocido'}</p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="font-semibold mb-2">Fotos</p>
              {user?.role === 'admin' && onEdit && (
                <button onClick={() => onEdit(poste)} className="text-sm text-yellow-600">Editar</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Array.isArray(poste.fotosURLs) && poste.fotosURLs.length > 0 ? (
                poste.fotosURLs.map((u: string, i: number) => (
                  <img key={i} src={u} alt={`foto-${i}`} className="w-full h-28 object-cover rounded" />
                ))
              ) : (
                <p className="text-sm text-gray-500">No hay fotos</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
