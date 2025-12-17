// components/GoogleMapComponent.tsx
"use client";

import { GoogleMap, Marker, InfoWindow, useLoadScript, Polyline, Polygon } from "@react-google-maps/api";
import { useState } from "react";
import RegistroModal from "./RegistrarPosteModal";
import VerPosteModal from "./VerPosteModal";
import { useAuth } from "@/lib/auth";

function formatFecha(value: any) {
  if (!value) return "";
  try {
    if (typeof value === "object" && (value.seconds || value.seconds === 0)) {
      return new Date((value.seconds as number) * 1000).toLocaleString();
    }
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toLocaleString();
    return String(value);
  } catch (e) {
    return String(value);
  }
}

export default function GoogleMapComponent({ postes, onSaved }: { postes: any[]; onSaved?: (post: any, replace?: boolean) => void }) {
  const { user, loading: authLoading } = useAuth();

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
  });

  const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [drawMode, setDrawMode] = useState<'none' | 'point' | 'line' | 'polygon'>('point');
  const [shapePoints, setShapePoints] = useState<google.maps.LatLngLiteral[]>([]);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    // Si auth aún está cargando, no permitir
    if (authLoading) {
      // opcional: toast/alert
      alert("Verificando sesión, espera un momento...");
      return;
    }
    if (!user) {
      alert("Debes iniciar sesión para registrar postes.");
      return;
    }

    if (!e.latLng) return;

    const point = { lat: e.latLng.lat(), lng: e.latLng.lng() };

    if (drawMode === 'line' || drawMode === 'polygon') {
      setShapePoints((s) => [...s, point]);
      // keep the small info panel but don't set selectedLocation for point modal
      setSelectedLocation(point);
      return;
    }

    // modo punto (postes)
    if (drawMode === 'point') {
      setSelectedLocation(point);
    }
    // mostramos el InfoWindow en la ubicación clickeada. El modal solo se abre si el usuario está autenticado.
  };

  if (loadError) return <p>Error cargando mapa. Revisa la API key.</p>;
  if (!isLoaded) return <p>Cargando mapa...</p>;

  return (
    <div className="w-full">
      <div className="grid gap-4 items-start">
        {/* Map column */}
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="relative w-full h-[420px] md:h-[600px]">

            <GoogleMap
              onClick={handleMapClick}
              zoom={14}
              center={
                // prefer first poste with lat/lng
                (postes && postes.find((x) => typeof x.lat === 'number' && typeof x.lng === 'number'))
                  ? { lat: (postes.find((x) => typeof x.lat === 'number' && typeof x.lng === 'number') as any).lat, lng: (postes.find((x) => typeof x.lat === 'number' && typeof x.lng === 'number') as any).lng }
                  : { lat: -2.1462, lng: -79.9647 }
              }
              mapContainerClassName="absolute inset-0 w-full h-full"
            >
              {/* Markers for postes */}
              {postes.filter(p => p.tipo === 'poste' || (typeof p.lat === 'number' && typeof p.lng === 'number')).map((p) => (
                <Marker
                  key={p.id || p.id_registro}
                  position={{ lat: p.lat, lng: p.lng }}
                  onClick={() => setSelectedPost(p)}
                />
              ))}

              {/* Polylines for líneas */}
              {postes.filter(p => p.tipo === 'linea' || (p.geometry && p.geometry.type === 'LineString')).map((p, idx) => (
                <Polyline key={p.id || p.id_registro || `line-${idx}`} path={p.geometry?.coordinates || []} options={{ strokeColor: '#0037A7', strokeWeight: 3 }} onClick={() => setSelectedPost(p)} />
              ))}

              {/* Polygons for polígonos */}
              {postes.filter(p => p.tipo === 'poligono' || (p.geometry && p.geometry.type === 'Polygon')).map((p, idx) => (
                <Polygon key={p.id || p.id_registro || `poly-${idx}`} paths={p.geometry?.coordinates || []} options={{ fillColor: '#0037A7', fillOpacity: 0.2, strokeColor: '#0037A7' }} onClick={() => setSelectedPost(p)} />
              ))}
            </GoogleMap>

            {/* Controls */}
            <div className="absolute left-6 top-6 z-40">
              <div className="bg-white p-2 rounded shadow">
                <div className="text-sm">Modo de registro</div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => { setDrawMode('point'); setShapePoints([]); }} className={`px-3 py-1 rounded ${drawMode==='point'?'bg-[#0037A7] text-white':'border'}`}>Punto</button>
                  <button onClick={() => { setDrawMode('line'); setSelectedLocation(null); setShapePoints([]); }} className={`px-3 py-1 rounded ${drawMode==='line'?'bg-[#0037A7] text-white':'border'}`}>Línea</button>
                  <button onClick={() => { setDrawMode('polygon'); setSelectedLocation(null); setShapePoints([]); }} className={`px-3 py-1 rounded ${drawMode==='polygon'?'bg-[#0037A7] text-white':'border'}`}>Polígono</button>
                  <button onClick={() => { setDrawMode('none'); setSelectedLocation(null); setShapePoints([]); }} className="px-3 py-1 rounded border">Limpiar</button>
                </div>

                {selectedLocation && drawMode === 'point' && (
                  <div className="mt-2">
                    <div className="text-sm">Nueva ubicación</div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setShowModal(true)}
                        className="bg-[#0037A7] text-white px-3 py-1 rounded"
                      >
                        Registrar poste
                      </button>
                      <button
                        onClick={() => setSelectedLocation(null)}
                        className="px-3 py-1 border rounded"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {(drawMode === 'line' || drawMode === 'polygon') && (
                  <div className="mt-2">
                    <div className="text-sm">Puntos: {shapePoints.length}</div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          if (shapePoints.length === 0) { alert('Agrega puntos haciendo clic en el mapa'); return; }
                          setShowModal(true);
                        }}
                        className="bg-[#0037A7] text-white px-3 py-1 rounded"
                      >
                        Registrar {drawMode === 'line' ? 'línea' : 'polígono'}
                      </button>
                      <button onClick={() => { setShapePoints([]); }} className="px-3 py-1 border rounded">Borrar puntos</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {showModal && (selectedLocation || shapePoints.length > 0) && (
              <RegistroModal
                location={drawMode === 'point' ? selectedLocation : shapePoints}
                currentUser={user}
                onClose={() => {
                  setShowModal(false);
                  setSelectedLocation(null);
                  setShapePoints([]);
                  setDrawMode('point');
                }}
                onSaved={onSaved}
              />
            )}

            {selectedPost && (
              <VerPosteModal
                poste={selectedPost}
                onClose={() => setSelectedPost(null)}
              />
            )}

            {/* Shape preview */}
            {shapePoints.length > 1 && drawMode === 'line' && (
              <Polyline path={shapePoints} options={{ strokeColor: '#0037A7', strokeWeight: 3 }} />
            )}
            {shapePoints.length > 2 && drawMode === 'polygon' && (
              <Polygon paths={shapePoints} options={{ fillColor: '#0037A7', fillOpacity: 0.2, strokeColor: '#0037A7' }} />
            )}
          </div>
        </div>


        
      </div>

      {/* Mobile: details below map handled by grid collapse */}
    </div>
  );
}
