// components/GoogleMapComponent.tsx
"use client";

import { GoogleMap, Marker, InfoWindow, useLoadScript } from "@react-google-maps/api";
import { useState } from "react";
import RegistroModal from "./RegistrarPosteModal";
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

    setSelectedLocation({
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    });
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
                postes && postes.length
                  ? { lat: postes[0].lat, lng: postes[0].lng }
                  : { lat: -2.1462, lng: -79.9647 }
              }
              mapContainerClassName="absolute inset-0 w-full h-full"
            >
              {postes.map((p) => (
                <Marker
                  key={p.id || p.id_registro}
                  position={{ lat: p.lat, lng: p.lng }}
                  onClick={() => setSelectedPost(p)}
                />
              ))}
            </GoogleMap>

            {selectedLocation && (
              <div className="absolute left-6 top-6 z-40">
                <div className="bg-white p-2 rounded shadow">
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
              </div>
            )}

            {showModal && selectedLocation && (
              <RegistroModal
                location={selectedLocation}
                currentUser={user}
                onClose={() => {
                  setShowModal(false);
                  setSelectedLocation(null);
                }}
                onSaved={onSaved}
              />
            )}
          </div>
        </div>


        
      </div>

      {/* Mobile: details below map handled by grid collapse */}
    </div>
  );
}
