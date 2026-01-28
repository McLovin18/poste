"use client";

import React from "react";
import { useAuth } from "@/lib/auth";

export default function VerPosteModal({ poste, onClose, onEdit }: { poste: any; onClose: () => void; onEdit?: (p: any) => void }) {
  const { user } = useAuth();
  if (!poste) return null;

  const humanType = poste.tipo === 'poste' ? 'Poste' : poste.tipo === 'linea' ? 'Línea' : poste.tipo === 'poligono' ? 'Polígono' : 'Elemento eléctrico';
  const createdAt: Date | null = poste.fecha?.toDate
    ? poste.fecha.toDate()
    : poste.fecha
    ? new Date(poste.fecha)
    : null;
  const createdAtLabel = createdAt && !isNaN(createdAt.getTime())
    ? createdAt.toLocaleString()
    : null;

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
            {createdAtLabel && (
              <p className="text-sm text-gray-600">Fecha de creación: {createdAtLabel}</p>
            )}

            {/* Datos geométricos comunes */}
            {poste.geometry && (
              <div className="text-sm text-gray-600 mt-3">
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

            {poste.itrs && (
              <div className="text-sm text-gray-600 mt-3">
                <p className="font-semibold">Coordenadas ITRS (ECEF)</p>
                <p className="text-xs">X: {Number(poste.itrs.x).toFixed(3)}</p>
                <p className="text-xs">Y: {Number(poste.itrs.y).toFixed(3)}</p>
                <p className="text-xs">Z: {Number(poste.itrs.z).toFixed(3)}</p>
              </div>
            )}

            {/* Datos antiguos planos (para compatibilidad) */}
            {poste.nivelTension && (
              <p className="text-sm text-gray-600 mt-3">Nivel de tensión: {poste.nivelTension}</p>
            )}
            {(poste.conexion1 || poste.conexion2) && (
              <div className="text-sm text-gray-600 mt-1">
                {poste.conexion1 && <p>Conexión 1: {poste.conexion1}</p>}
                {poste.conexion2 && <p>Conexión 2: {poste.conexion2}</p>}
              </div>
            )}

            {poste.estructura && (
              <div className="text-sm text-gray-600 mt-3">
                <p className="font-semibold">Estructura (campo antiguo)</p>
                <p>Código: {poste.estructura.codigo}</p>
              </div>
            )}

            {/* Datos estructurados detallados para POSTE */}
            {poste.tipo === 'poste' && (
              <div className="mt-4 space-y-4 border-t pt-3">
                {/* Datos del poste */}
                <div>
                  <p className="text-sm font-semibold mb-1">Datos del poste</p>
                  {poste.poste && (
                    <div className="text-sm text-gray-700 space-y-0.5">
                      {poste.poste.subtipo && <p>Subtipo: {poste.poste.subtipo}</p>}
                      {poste.poste.numeroPoste && <p>No. poste: {poste.poste.numeroPoste}</p>}
                      {poste.poste.propiedad && <p>Propiedad: {poste.poste.propiedad}</p>}
                      {poste.poste.cimiento && <p>Cimiento: {poste.poste.cimiento}</p>}
                      {(poste.poste.codigoEstructura || poste.estructura?.codigo) && (
                        <p>Código estructura: {poste.poste.codigoEstructura || poste.estructura?.codigo}</p>
                      )}
                      {poste.poste.estructuraEnPoste && <p>Estructura en poste: {poste.poste.estructuraEnPoste}</p>}
                      {poste.poste.tipoUso && <p>Tipo uso poste: {poste.poste.tipoUso}</p>}
                      {poste.poste.ordenTrabajo && <p>Orden de trabajo: {poste.poste.ordenTrabajo}</p>}
                    </div>
                  )}
                </div>

                {/* Punto de carga */}
                {poste.puntoCarga && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Punto de carga (medidor)</p>
                    <div className="text-sm text-gray-700 space-y-0.5">
                      {poste.puntoCarga.subtipo && <p>Subtipo: {poste.puntoCarga.subtipo}</p>}
                      {poste.puntoCarga.numeroMedidor && <p>No. medidor: {poste.puntoCarga.numeroMedidor}</p>}
                      {poste.puntoCarga.marcaMedidor && <p>Marca: {poste.puntoCarga.marcaMedidor}</p>}
                      {poste.puntoCarga.voltajeMedidor && <p>Voltaje: {poste.puntoCarga.voltajeMedidor}</p>}
                      {poste.puntoCarga.ordenTrabajo && <p>Orden de trabajo: {poste.puntoCarga.ordenTrabajo}</p>}
                    </div>
                  </div>
                )}

                {/* Luminaria */}
                {(poste.luminariaInfo || poste.luminaria) && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Luminaria</p>
                    <div className="text-sm text-gray-700 space-y-0.5">
                      {poste.luminariaInfo?.subtipo && <p>Subtipo: {poste.luminariaInfo.subtipo}</p>}
                      {(poste.luminariaInfo?.codigoEstructura || poste.luminaria?.codigo) && (
                        <p>Código estructura: {poste.luminariaInfo?.codigoEstructura || poste.luminaria?.codigo}</p>
                      )}
                      {poste.luminariaInfo?.bajoMedicion && <p>Bajo medición: {poste.luminariaInfo.bajoMedicion}</p>}
                      {poste.luminariaInfo?.clasificacionAp && <p>Clasificación AP: {poste.luminariaInfo.clasificacionAp}</p>}
                      {poste.luminariaInfo?.potencia && <p>Potencia: {poste.luminariaInfo.potencia}</p>}
                      {poste.luminariaInfo?.propiedad && <p>Propiedad: {poste.luminariaInfo.propiedad}</p>}
                      {poste.luminariaInfo?.fuenteEnergia && <p>Fuente de energía: {poste.luminariaInfo.fuenteEnergia}</p>}
                      {poste.luminariaInfo?.ordenTrabajo && <p>Orden de trabajo: {poste.luminariaInfo.ordenTrabajo}</p>}
                    </div>
                  </div>
                )}

                {/* Semáforo */}
                {poste.semaforo && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Semáforo</p>
                    <div className="text-sm text-gray-700 space-y-0.5">
                      {poste.semaforo.subtipo && <p>Subtipo: {poste.semaforo.subtipo}</p>}
                      {poste.semaforo.codigoEstructura && <p>Código estructura: {poste.semaforo.codigoEstructura}</p>}
                      {poste.semaforo.ordenTrabajo && <p>Orden de trabajo: {poste.semaforo.ordenTrabajo}</p>}
                    </div>
                  </div>
                )}

                {/* Capacitor */}
                {(poste.capacitorInfo || poste.capacitor) && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Capacitor</p>
                    <div className="text-sm text-gray-700 space-y-0.5">
                      {poste.capacitorInfo?.subtipo && <p>Subtipo: {poste.capacitorInfo.subtipo}</p>}
                      {poste.capacitorInfo?.codigoEstructura && <p>Código estructura: {poste.capacitorInfo.codigoEstructura}</p>}
                      {poste.capacitorInfo?.potencia && <p>Potencia: {poste.capacitorInfo.potencia}</p>}
                      {poste.capacitorInfo?.ordenTrabajo && <p>Orden de trabajo: {poste.capacitorInfo.ordenTrabajo}</p>}
                      {poste.capacitor && <p>Texto capacitor (antiguo): {poste.capacitor}</p>}
                    </div>
                  </div>
                )}

                {/* Seccionador cuchilla */}
                {poste.seccionadorCuchilla && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Seccionador cuchilla</p>
                    <div className="text-sm text-gray-700 space-y-0.5">
                      {poste.seccionadorCuchilla.subtipo && <p>Subtipo: {poste.seccionadorCuchilla.subtipo}</p>}
                      {poste.seccionadorCuchilla.codigoEstructura && <p>Código estructura: {poste.seccionadorCuchilla.codigoEstructura}</p>}
                      {poste.seccionadorCuchilla.corriente && <p>Corriente: {poste.seccionadorCuchilla.corriente}</p>}
                      {poste.seccionadorCuchilla.corrienteCortocircuito && <p>Corriente máx. corto: {poste.seccionadorCuchilla.corrienteCortocircuito}</p>}
                      {poste.seccionadorCuchilla.tipoUso && <p>Tipo de uso: {poste.seccionadorCuchilla.tipoUso}</p>}
                      {poste.seccionadorCuchilla.ordenTrabajo && <p>Orden de trabajo: {poste.seccionadorCuchilla.ordenTrabajo}</p>}
                    </div>
                  </div>
                )}

                {/* Protección dinámica */}
                {poste.proteccionDinamica && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Protección dinámico</p>
                    <div className="text-sm text-gray-700 space-y-0.5">
                      {poste.proteccionDinamica.subtipo && <p>Subtipo: {poste.proteccionDinamica.subtipo}</p>}
                      {poste.proteccionDinamica.codigoEstructura && <p>Código estructura: {poste.proteccionDinamica.codigoEstructura}</p>}
                      {poste.proteccionDinamica.corriente && <p>Corriente: {poste.proteccionDinamica.corriente}</p>}
                      {poste.proteccionDinamica.observaciones && <p>Observaciones: {poste.proteccionDinamica.observaciones}</p>}
                      {poste.proteccionDinamica.tipoUso && <p>Tipo de uso: {poste.proteccionDinamica.tipoUso}</p>}
                      {poste.proteccionDinamica.control && <p>Control: {poste.proteccionDinamica.control}</p>}
                      {poste.proteccionDinamica.ordenTrabajo && <p>Orden de trabajo: {poste.proteccionDinamica.ordenTrabajo}</p>}
                    </div>
                  </div>
                )}

                {/* Seccionador fusible */}
                {(poste.seccionadorFusible || poste.seccionadoresFusible) && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Seccionador fusible</p>
                    <div className="text-sm text-gray-700 space-y-0.5">
                      {poste.seccionadorFusible?.subtipo && <p>Subtipo: {poste.seccionadorFusible.subtipo}</p>}
                      {poste.seccionadorFusible?.codigoEstructura && <p>Código estructura: {poste.seccionadorFusible.codigoEstructura}</p>}
                      {poste.seccionadorFusible?.tirafusible && <p>Tirafusible: {poste.seccionadorFusible.tirafusible}</p>}
                      {poste.seccionadorFusible?.ordenTrabajo && <p>Orden de trabajo: {poste.seccionadorFusible.ordenTrabajo}</p>}
                      {poste.seccionadoresFusible && <p>Texto fusible (antiguo): {poste.seccionadoresFusible}</p>}
                    </div>
                  </div>
                )}

                {/* Puesto transf. distribución */}
                {poste.puestoTransDistribucion && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Puesto transf. distribución</p>
                    <div className="text-sm text-gray-700 space-y-0.5">
                      {poste.puestoTransDistribucion.subtipo && <p>Subtipo: {poste.puestoTransDistribucion.subtipo}</p>}
                      {poste.puestoTransDistribucion.voltajeMedia && <p>Voltaje media: {poste.puestoTransDistribucion.voltajeMedia}</p>}
                      {poste.puestoTransDistribucion.potencia && <p>Potencia: {poste.puestoTransDistribucion.potencia}</p>}
                      {poste.puestoTransDistribucion.configuracionBT && <p>Configuración BT: {poste.puestoTransDistribucion.configuracionBT}</p>}
                      {poste.puestoTransDistribucion.numeroTrafo && <p>No. trafo: {poste.puestoTransDistribucion.numeroTrafo}</p>}
                      {poste.puestoTransDistribucion.codigoEstructura && <p>Código estructura: {poste.puestoTransDistribucion.codigoEstructura}</p>}
                      {poste.puestoTransDistribucion.voltajeBaja && <p>Voltaje baja: {poste.puestoTransDistribucion.voltajeBaja}</p>}
                      {poste.puestoTransDistribucion.configuracionAlta && <p>Config. lado alta: {poste.puestoTransDistribucion.configuracionAlta}</p>}
                      {poste.puestoTransDistribucion.tipo && <p>Tipo: {poste.puestoTransDistribucion.tipo}</p>}
                      {poste.puestoTransDistribucion.tipoRed && <p>Tipo red: {poste.puestoTransDistribucion.tipoRed}</p>}
                      {poste.puestoTransDistribucion.ordenTrabajo && <p>Orden de trabajo: {poste.puestoTransDistribucion.ordenTrabajo}</p>}
                    </div>
                  </div>
                )}

                {/* Puesto transf. potencia */}
                {poste.puestoTransPotencia && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Puesto transf. potencia</p>
                    <div className="text-sm text-gray-700 space-y-0.5">
                      {poste.puestoTransPotencia.subtipo && <p>Subtipo: {poste.puestoTransPotencia.subtipo}</p>}
                      {poste.puestoTransPotencia.comentariosPotencia && <p>Comentarios/potencia: {poste.puestoTransPotencia.comentariosPotencia}</p>}
                      {poste.puestoTransPotencia.potenciaKva && <p>Potencia kVA: {poste.puestoTransPotencia.potenciaKva}</p>}
                      {poste.puestoTransPotencia.propiedad && <p>Propiedad: {poste.puestoTransPotencia.propiedad}</p>}
                      {poste.puestoTransPotencia.observacionesTap && <p>Obs./TAP: {poste.puestoTransPotencia.observacionesTap}</p>}
                      {poste.puestoTransPotencia.tipoTransfPotencia && <p>Tipo transf. potencia: {poste.puestoTransPotencia.tipoTransfPotencia}</p>}
                      {poste.puestoTransPotencia.ordenTrabajo && <p>Orden de trabajo: {poste.puestoTransPotencia.ordenTrabajo}</p>}
                    </div>
                  </div>
                )}

                {/* Subestación */}
                {poste.subestacion && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Subestación</p>
                    <div className="text-sm text-gray-700 space-y-0.5">
                      {poste.subestacion.subtipo && <p>Subtipo: {poste.subestacion.subtipo}</p>}
                      {poste.subestacion.nombre && <p>Nombre: {poste.subestacion.nombre}</p>}
                      {poste.subestacion.numero && <p>Número: {poste.subestacion.numero}</p>}
                      {poste.subestacion.codigoEstructura && <p>Código estructura: {poste.subestacion.codigoEstructura}</p>}
                      {poste.subestacion.vPrimario && <p>V. primario: {poste.subestacion.vPrimario}</p>}
                      {poste.subestacion.vSecundario && <p>V. secundario: {poste.subestacion.vSecundario}</p>}
                      {poste.subestacion.ordenTrabajo && <p>Orden de trabajo: {poste.subestacion.ordenTrabajo}</p>}
                    </div>
                  </div>
                )}

                {/* Tensor */}
                {poste.tensor && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Tensor</p>
                    <div className="text-sm text-gray-700 space-y-0.5">
                      {poste.tensor.subtipo && <p>Subtipo: {poste.tensor.subtipo}</p>}
                      {poste.tensor.codigoEstructura && <p>Código estructura: {poste.tensor.codigoEstructura}</p>}
                      {poste.tensor.ordenTrabajo && <p>Orden de trabajo: {poste.tensor.ordenTrabajo}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="text-sm mt-3">Creado por: {user?.email || user?.name || 'Desconocido'}</p>
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
