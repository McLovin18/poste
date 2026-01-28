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
  // Datos principales de POSTE
  const [posteSubtipo, setPosteSubtipo] = useState<string>("");
  const [posteNumero, setPosteNumero] = useState<string>(""); // No. POSTE
  const [postePropiedad, setPostePropiedad] = useState<string>("");
  const [posteCimiento, setPosteCimiento] = useState<string>("");
  const [posteCodigoEstructura, setPosteCodigoEstructura] = useState<string>("");
  const [posteEstructuraEnPoste, setPosteEstructuraEnPoste] = useState<string>("");
  const [posteTipoUso, setPosteTipoUso] = useState<string>("");
  const [posteOrdenTrabajo, setPosteOrdenTrabajo] = useState<string>("");

  // Grupos opcionales (checklist) asociados al poste
  const [hasPuntoCarga, setHasPuntoCarga] = useState<boolean>(false);
  const [puntoCargaSubtipo, setPuntoCargaSubtipo] = useState<string>("");
  const [puntoCargaNumeroMedidor, setPuntoCargaNumeroMedidor] = useState<string>("");
  const [puntoCargaMarca, setPuntoCargaMarca] = useState<string>("");
  const [puntoCargaVoltaje, setPuntoCargaVoltaje] = useState<string>("");
  const [puntoCargaOrdenTrabajo, setPuntoCargaOrdenTrabajo] = useState<string>("");

  const [hasLuminaria, setHasLuminaria] = useState<boolean>(false);
  const [luminariaSubtipo, setLuminariaSubtipo] = useState<string>("");
  const [luminariaCodigoEstructura, setLuminariaCodigoEstructura] = useState<string>("");
  const [luminariaBajoMedicion, setLuminariaBajoMedicion] = useState<string>("");
  const [luminariaClasificacionAp, setLuminariaClasificacionAp] = useState<string>("");
  const [luminariaPotencia, setLuminariaPotencia] = useState<string>("");
  const [luminariaPropiedad, setLuminariaPropiedad] = useState<string>("");
  const [luminariaFuenteEnergia, setLuminariaFuenteEnergia] = useState<string>("");
  const [luminariaOrdenTrabajo, setLuminariaOrdenTrabajo] = useState<string>("");

  const [hasSemaforo, setHasSemaforo] = useState<boolean>(false);
  const [semaforoSubtipo, setSemaforoSubtipo] = useState<string>("");
  const [semaforoCodigoEstructura, setSemaforoCodigoEstructura] = useState<string>("");
  const [semaforoOrdenTrabajo, setSemaforoOrdenTrabajo] = useState<string>("");

  const [hasCapacitor, setHasCapacitor] = useState<boolean>(false);
  const [capacitorSubtipo, setCapacitorSubtipo] = useState<string>("");
  const [capacitorCodigoEstructura, setCapacitorCodigoEstructura] = useState<string>("");
  const [capacitorPotencia, setCapacitorPotencia] = useState<string>("");
  const [capacitorOrdenTrabajo, setCapacitorOrdenTrabajo] = useState<string>("");

  const [hasSeccionadorCuchilla, setHasSeccionadorCuchilla] = useState<boolean>(false);
  const [seccionadorCuchillaSubtipo, setSeccionadorCuchillaSubtipo] = useState<string>("");
  const [seccionadorCuchillaCodigoEstructura, setSeccionadorCuchillaCodigoEstructura] = useState<string>("");
  const [seccionadorCuchillaCorriente, setSeccionadorCuchillaCorriente] = useState<string>("");
  const [seccionadorCuchillaCorrienteCorto, setSeccionadorCuchillaCorrienteCorto] = useState<string>("");
  const [seccionadorCuchillaTipoUso, setSeccionadorCuchillaTipoUso] = useState<string>("");
  const [seccionadorCuchillaOrdenTrabajo, setSeccionadorCuchillaOrdenTrabajo] = useState<string>("");

  const [hasProteccionDinamica, setHasProteccionDinamica] = useState<boolean>(false);
  const [proteccionDinamicaSubtipo, setProteccionDinamicaSubtipo] = useState<string>("");
  const [proteccionDinamicaCodigoEstructura, setProteccionDinamicaCodigoEstructura] = useState<string>("");
  const [proteccionDinamicaCorriente, setProteccionDinamicaCorriente] = useState<string>("");
  const [proteccionDinamicaObservaciones, setProteccionDinamicaObservaciones] = useState<string>("");
  const [proteccionDinamicaTipoUso, setProteccionDinamicaTipoUso] = useState<string>("");
  const [proteccionDinamicaControl, setProteccionDinamicaControl] = useState<string>("");
  const [proteccionDinamicaOrdenTrabajo, setProteccionDinamicaOrdenTrabajo] = useState<string>("");

  const [hasSeccionadorFusible, setHasSeccionadorFusible] = useState<boolean>(false);
  const [seccionadorFusibleSubtipo, setSeccionadorFusibleSubtipo] = useState<string>("");
  const [seccionadorFusibleCodigoEstructura, setSeccionadorFusibleCodigoEstructura] = useState<string>("");
  const [seccionadorFusibleTirafusible, setSeccionadorFusibleTirafusible] = useState<string>("");
  const [seccionadorFusibleOrdenTrabajo, setSeccionadorFusibleOrdenTrabajo] = useState<string>("");

  const [hasPuestoTransDistribucion, setHasPuestoTransDistribucion] = useState<boolean>(false);
  const [puestoTransDistribucionSubtipo, setPuestoTransDistribucionSubtipo] = useState<string>("");
  const [puestoTransDistribucionVoltajeMedia, setPuestoTransDistribucionVoltajeMedia] = useState<string>("");
  const [puestoTransDistribucionPotencia, setPuestoTransDistribucionPotencia] = useState<string>("");
  const [puestoTransDistribucionConfigBT, setPuestoTransDistribucionConfigBT] = useState<string>("");
  const [puestoTransDistribucionNumeroTrafo, setPuestoTransDistribucionNumeroTrafo] = useState<string>("");
  const [puestoTransDistribucionCodigoEstructura, setPuestoTransDistribucionCodigoEstructura] = useState<string>("");
  const [puestoTransDistribucionVoltajeBaja, setPuestoTransDistribucionVoltajeBaja] = useState<string>("");
  const [puestoTransDistribucionConfigAlta, setPuestoTransDistribucionConfigAlta] = useState<string>("");
  const [puestoTransDistribucionTipo, setPuestoTransDistribucionTipo] = useState<string>("");
  const [puestoTransDistribucionTipoRed, setPuestoTransDistribucionTipoRed] = useState<string>("");
  const [puestoTransDistribucionOrdenTrabajo, setPuestoTransDistribucionOrdenTrabajo] = useState<string>("");

  const [hasPuestoTransPotencia, setHasPuestoTransPotencia] = useState<boolean>(false);
  const [puestoTransPotenciaSubtipo, setPuestoTransPotenciaSubtipo] = useState<string>("");
  const [puestoTransPotenciaComentarios, setPuestoTransPotenciaComentarios] = useState<string>("");
  const [puestoTransPotenciaKva, setPuestoTransPotenciaKva] = useState<string>("");
  const [puestoTransPotenciaPropiedad, setPuestoTransPotenciaPropiedad] = useState<string>("");
  const [puestoTransPotenciaTap, setPuestoTransPotenciaTap] = useState<string>("");
  const [puestoTransPotenciaTipo, setPuestoTransPotenciaTipo] = useState<string>("");
  const [puestoTransPotenciaOrdenTrabajo, setPuestoTransPotenciaOrdenTrabajo] = useState<string>("");

  const [hasSubestacion, setHasSubestacion] = useState<boolean>(false);
  const [subestacionSubtipo, setSubestacionSubtipo] = useState<string>("");
  const [subestacionNombre, setSubestacionNombre] = useState<string>("");
  const [subestacionNumero, setSubestacionNumero] = useState<string>("");
  const [subestacionCodigoEstructura, setSubestacionCodigoEstructura] = useState<string>("");
  const [subestacionVPrimario, setSubestacionVPrimario] = useState<string>("");
  const [subestacionVSecundario, setSubestacionVSecundario] = useState<string>("");
  const [subestacionOrdenTrabajo, setSubestacionOrdenTrabajo] = useState<string>("");

  const [hasTensor, setHasTensor] = useState<boolean>(false);
  const [tensorSubtipo, setTensorSubtipo] = useState<string>("");
  const [tensorCodigoEstructura, setTensorCodigoEstructura] = useState<string>("");
  const [tensorOrdenTrabajo, setTensorOrdenTrabajo] = useState<string>("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  const removePhoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

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
        // compute a simple ITRS (ECEF) representation from lat/lng
        const lat = Number(place.lat);
        const lon = Number(place.lng);
        const toRad = (d: number) => (d * Math.PI) / 180;
        const a = 6378137.0;
        const f = 1 / 298.257223563;
        const e2 = f * (2 - f);
        const sinLat = Math.sin(toRad(lat));
        const cosLat = Math.cos(toRad(lat));
        const sinLon = Math.sin(toRad(lon));
        const cosLon = Math.cos(toRad(lon));
        const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);
        const h = 0; // assume 0 height if not provided
        const x = (N + h) * cosLat * cosLon;
        const y = (N + h) * cosLat * sinLon;
        const z = ((1 - e2) * N + h) * sinLat;
        optimisticPost.itrs = { x, y, z };
        // include form fields
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
        // compute and store ITRS (ECEF) coordinates
        try {
          const lat = Number(place.lat);
          const lon = Number(place.lng);
          const toRad = (d: number) => (d * Math.PI) / 180;
          const a = 6378137.0;
          const f = 1 / 298.257223563;
          const e2 = f * (2 - f);
          const sinLat = Math.sin(toRad(lat));
          const cosLat = Math.cos(toRad(lat));
          const sinLon = Math.sin(toRad(lon));
          const cosLon = Math.cos(toRad(lon));
          const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);
          const h = 0;
          const x = (N + h) * cosLat * cosLon;
          const y = (N + h) * cosLat * sinLon;
          const z = ((1 - e2) * N + h) * sinLat;
          docData.itrs = { x, y, z };
        } catch (e) {
          // ignore
        }
        // Datos estructurados del POSTE
        docData.poste = {
          subtipo: posteSubtipo || null,
          numeroPoste: posteNumero || null,
          propiedad: postePropiedad || null,
          cimiento: posteCimiento || null,
          codigoEstructura: posteCodigoEstructura || null,
          estructuraEnPoste: posteEstructuraEnPoste || null,
          tipoUso: posteTipoUso || null,
          ordenTrabajo: posteOrdenTrabajo || null,
        };

        // Mapear código de estructura principal al campo existente "estructura"
        if (posteCodigoEstructura) {
          docData.estructura = { codigo: posteCodigoEstructura };
        }

        // PUNTO DE CARGA (medidor)
        if (hasPuntoCarga) {
          docData.puntoCarga = {
            subtipo: puntoCargaSubtipo || null,
            numeroMedidor: puntoCargaNumeroMedidor || null,
            marcaMedidor: puntoCargaMarca || null,
            voltajeMedidor: puntoCargaVoltaje || null,
            ordenTrabajo: puntoCargaOrdenTrabajo || null,
          };
        }

        // LUMINARIA
        if (hasLuminaria) {
          docData.luminariaInfo = {
            subtipo: luminariaSubtipo || null,
            codigoEstructura: luminariaCodigoEstructura || null,
            bajoMedicion: luminariaBajoMedicion || null,
            clasificacionAp: luminariaClasificacionAp || null,
            potencia: luminariaPotencia || null,
            propiedad: luminariaPropiedad || null,
            fuenteEnergia: luminariaFuenteEnergia || null,
            ordenTrabajo: luminariaOrdenTrabajo || null,
          };
          // Mantener compatibilidad con campo existente "luminaria"
          if (luminariaCodigoEstructura) {
            docData.luminaria = { codigo: luminariaCodigoEstructura };
          }
        }

        // SEMAFORO
        if (hasSemaforo) {
          docData.semaforo = {
            subtipo: semaforoSubtipo || null,
            codigoEstructura: semaforoCodigoEstructura || null,
            ordenTrabajo: semaforoOrdenTrabajo || null,
          };
        }

        // CAPACITOR
        if (hasCapacitor) {
          docData.capacitorInfo = {
            subtipo: capacitorSubtipo || null,
            codigoEstructura: capacitorCodigoEstructura || null,
            potencia: capacitorPotencia || null,
            ordenTrabajo: capacitorOrdenTrabajo || null,
          };
          if (capacitorPotencia) {
            docData.capacitor = capacitorPotencia;
          }
        }

        // SECCIONADOR CUCHILLA
        if (hasSeccionadorCuchilla) {
          docData.seccionadorCuchilla = {
            subtipo: seccionadorCuchillaSubtipo || null,
            codigoEstructura: seccionadorCuchillaCodigoEstructura || null,
            corriente: seccionadorCuchillaCorriente || null,
            corrienteCortocircuito: seccionadorCuchillaCorrienteCorto || null,
            tipoUso: seccionadorCuchillaTipoUso || null,
            ordenTrabajo: seccionadorCuchillaOrdenTrabajo || null,
          };
        }

        // PROTECCION DINAMICA
        if (hasProteccionDinamica) {
          docData.proteccionDinamica = {
            subtipo: proteccionDinamicaSubtipo || null,
            codigoEstructura: proteccionDinamicaCodigoEstructura || null,
            corriente: proteccionDinamicaCorriente || null,
            observaciones: proteccionDinamicaObservaciones || null,
            tipoUso: proteccionDinamicaTipoUso || null,
            control: proteccionDinamicaControl || null,
            ordenTrabajo: proteccionDinamicaOrdenTrabajo || null,
          };
        }

        // SECCIONADOR FUSIBLE
        if (hasSeccionadorFusible) {
          docData.seccionadorFusible = {
            subtipo: seccionadorFusibleSubtipo || null,
            codigoEstructura: seccionadorFusibleCodigoEstructura || null,
            tirafusible: seccionadorFusibleTirafusible || null,
            ordenTrabajo: seccionadorFusibleOrdenTrabajo || null,
          };
          if (seccionadorFusibleTirafusible) {
            docData.seccionadoresFusible = seccionadorFusibleTirafusible;
          }
        }

        // PUESTO TRANSFORMACION DISTRIBUCION
        if (hasPuestoTransDistribucion) {
          docData.puestoTransDistribucion = {
            subtipo: puestoTransDistribucionSubtipo || null,
            voltajeMedia: puestoTransDistribucionVoltajeMedia || null,
            potencia: puestoTransDistribucionPotencia || null,
            configuracionBT: puestoTransDistribucionConfigBT || null,
            numeroTrafo: puestoTransDistribucionNumeroTrafo || null,
            codigoEstructura: puestoTransDistribucionCodigoEstructura || null,
            voltajeBaja: puestoTransDistribucionVoltajeBaja || null,
            configuracionAlta: puestoTransDistribucionConfigAlta || null,
            tipo: puestoTransDistribucionTipo || null,
            tipoRed: puestoTransDistribucionTipoRed || null,
            ordenTrabajo: puestoTransDistribucionOrdenTrabajo || null,
          };
        }

        // PUESTO TRANSFORMACION POTENCIA
        if (hasPuestoTransPotencia) {
          docData.puestoTransPotencia = {
            subtipo: puestoTransPotenciaSubtipo || null,
            comentariosPotencia: puestoTransPotenciaComentarios || null,
            potenciaKva: puestoTransPotenciaKva || null,
            propiedad: puestoTransPotenciaPropiedad || null,
            observacionesTap: puestoTransPotenciaTap || null,
            tipoTransfPotencia: puestoTransPotenciaTipo || null,
            ordenTrabajo: puestoTransPotenciaOrdenTrabajo || null,
          };
        }

        // SUBESTACION
        if (hasSubestacion) {
          docData.subestacion = {
            subtipo: subestacionSubtipo || null,
            nombre: subestacionNombre || null,
            numero: subestacionNumero || null,
            codigoEstructura: subestacionCodigoEstructura || null,
            vPrimario: subestacionVPrimario || null,
            vSecundario: subestacionVSecundario || null,
            ordenTrabajo: subestacionOrdenTrabajo || null,
          };
        }

        // TENSOR
        if (hasTensor) {
          docData.tensor = {
            subtipo: tensorSubtipo || null,
            codigoEstructura: tensorCodigoEstructura || null,
            ordenTrabajo: tensorOrdenTrabajo || null,
          };
        }
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
        finalPost.itrs = optimisticPost.itrs;
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
      <div className="bg-white p-6 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        <h2 className="text-2xl font-bold">Registrar nuevo poste</h2>
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
          if (files.length === 0) return;
          setFotos((prev) => [...prev, ...files]);
          try {
            const urls = files.map((f) => URL.createObjectURL(f));
            setPreviews((prev) => [...prev, ...urls]);
          } catch (e) { setPreviews((prev) => prev); }
        }} />

        {/* Datos detallados para POSTE con checklist de elementos asociados */}
        {tipoEntidad === 'poste' && (
          <div className="mt-6 border-t pt-4 space-y-4">
            {/* Datos principales del poste */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Datos del poste</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium">Subtipo de poste</label>
                  <select
                    className="w-full border p-2 text-sm"
                    value={posteSubtipo}
                    onChange={(e) => setPosteSubtipo(e.target.value)}
                  >
                    <option value="">Selecciona...</option>
                    <option>Poste Hormigon</option>
                    <option>Poste Madera</option>
                    <option>Poste Plastico</option>
                    <option>Poste Metalico</option>
                    <option>Poste Semaforización</option>
                    <option>Torre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">No. Poste</label>
                  <input
                    className="w-full border p-2 text-sm"
                    maxLength={12}
                    value={posteNumero}
                    onChange={(e) => setPosteNumero(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Propiedad</label>
                  <select
                    className="w-full border p-2 text-sm"
                    value={postePropiedad}
                    onChange={(e) => setPostePropiedad(e.target.value)}
                  >
                    <option value="">Selecciona...</option>
                    <option>CNEL</option>
                    <option>Municipal</option>
                    <option>Privado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="block text-sm font-medium">Cimiento</label>
                  <select
                    className="w-full border p-2 text-sm"
                    value={posteCimiento}
                    onChange={(e) => setPosteCimiento(e.target.value)}
                  >
                    <option value="">Selecciona...</option>
                    <option>Prefabricado</option>
                    <option>Hormigón colado</option>
                    <option>Directo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Código estructura</label>
                  <input
                    className="w-full border p-2 text-sm"
                    value={posteCodigoEstructura}
                    onChange={(e) => setPosteCodigoEstructura(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Tipo uso poste</label>
                  <select
                    className="w-full border p-2 text-sm"
                    value={posteTipoUso}
                    onChange={(e) => setPosteTipoUso(e.target.value)}
                  >
                    <option value="">Selecciona...</option>
                    <option>Distribución</option>
                    <option>Iluminación</option>
                    <option>Subtransmisión</option>
                    <option>Otros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="block text-sm font-medium">Estructura en poste</label>
                  <input
                    className="w-full border p-2 text-sm"
                    maxLength={30}
                    value={posteEstructuraEnPoste}
                    onChange={(e) => setPosteEstructuraEnPoste(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Orden de trabajo</label>
                  <input
                    className="w-full border p-2 text-sm"
                    maxLength={20}
                    value={posteOrdenTrabajo}
                    onChange={(e) => setPosteOrdenTrabajo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Checklist de elementos asociados */}
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Elementos asociados al poste</h3>
              <p className="text-xs text-gray-500 mb-3">Marca los elementos que existen en este poste y completa solo sus campos.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={hasPuntoCarga} onChange={(e) => setHasPuntoCarga(e.target.checked)} />
                  <span>Punto de carga</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={hasLuminaria} onChange={(e) => setHasLuminaria(e.target.checked)} />
                  <span>Luminaria</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={hasSemaforo} onChange={(e) => setHasSemaforo(e.target.checked)} />
                  <span>Semáforo</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={hasCapacitor} onChange={(e) => setHasCapacitor(e.target.checked)} />
                  <span>Capacitor</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={hasSeccionadorCuchilla} onChange={(e) => setHasSeccionadorCuchilla(e.target.checked)} />
                  <span>Seccionador cuchilla</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={hasSeccionadorFusible} onChange={(e) => setHasSeccionadorFusible(e.target.checked)} />
                  <span>Seccionador fusible</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={hasProteccionDinamica} onChange={(e) => setHasProteccionDinamica(e.target.checked)} />
                  <span>Protección dinámico</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={hasPuestoTransDistribucion} onChange={(e) => setHasPuestoTransDistribucion(e.target.checked)} />
                  <span>Puesto transf. distribución</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={hasPuestoTransPotencia} onChange={(e) => setHasPuestoTransPotencia(e.target.checked)} />
                  <span>Puesto transf. potencia</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={hasSubestacion} onChange={(e) => setHasSubestacion(e.target.checked)} />
                  <span>Subestación</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={hasTensor} onChange={(e) => setHasTensor(e.target.checked)} />
                  <span>Tensor</span>
                </label>
              </div>
            </div>

            {/* PUNTO DE CARGA */}
            {hasPuntoCarga && (
              <div className="mt-4 border rounded-xl p-3 bg-slate-50/60">
                <h4 className="text-sm font-semibold mb-2">Punto de carga (medidor)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium">Subtipo</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={puntoCargaSubtipo}
                      onChange={(e) => setPuntoCargaSubtipo(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Medidor Alto Voltaje</option>
                      <option>Medidor Medio Voltaje</option>
                      <option>Medidor Bajo Voltaje</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Número del medidor</label>
                    <input
                      className="w-full border p-2 text-sm"
                      maxLength={20}
                      value={puntoCargaNumeroMedidor}
                      onChange={(e) => setPuntoCargaNumeroMedidor(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Marca del medidor</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={puntoCargaMarca}
                      onChange={(e) => setPuntoCargaMarca(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Landis+Gyr</option>
                      <option>Elster</option>
                      <option>Otra</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium">Voltaje del medidor</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={puntoCargaVoltaje}
                      onChange={(e) => setPuntoCargaVoltaje(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>120 V</option>
                      <option>240 V</option>
                      <option>480 V</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Orden de trabajo</label>
                    <input
                      className="w-full border p-2 text-sm"
                      maxLength={20}
                      value={puntoCargaOrdenTrabajo}
                      onChange={(e) => setPuntoCargaOrdenTrabajo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* LUMINARIA */}
            {hasLuminaria && (
              <div className="mt-4 border rounded-xl p-3 bg-slate-50/60">
                <h4 className="text-sm font-semibold mb-2">Luminaria</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium">Subtipo</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={luminariaSubtipo}
                      onChange={(e) => setLuminariaSubtipo(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Mercurio Cerrada</option>
                      <option>Mercurio Abierta</option>
                      <option>Sodio Abierta</option>
                      <option>Sodio Cerrada</option>
                      <option>LED</option>
                      <option>Proyector Sodio</option>
                      <option>Proyector Mercurio</option>
                      <option>Inducción</option>
                      <option>Proyector Metal Halide</option>
                      <option>Metal Halide</option>
                      <option>Proyector LED</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Código estructura</label>
                    <input
                      className="w-full border p-2 text-sm"
                      value={luminariaCodigoEstructura}
                      onChange={(e) => setLuminariaCodigoEstructura(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Bajo medición</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={luminariaBajoMedicion}
                      onChange={(e) => setLuminariaBajoMedicion(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Si</option>
                      <option>No</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium">Clasificación AP</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={luminariaClasificacionAp}
                      onChange={(e) => setLuminariaClasificacionAp(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>AP1</option>
                      <option>AP2</option>
                      <option>AP3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Potencia (W)</label>
                    <input
                      className="w-full border p-2 text-sm"
                      maxLength={5}
                      value={luminariaPotencia}
                      onChange={(e) => setLuminariaPotencia(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Propiedad</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={luminariaPropiedad}
                      onChange={(e) => setLuminariaPropiedad(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>CNEL</option>
                      <option>Municipal</option>
                      <option>Privado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Fuente de energía</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={luminariaFuenteEnergia}
                      onChange={(e) => setLuminariaFuenteEnergia(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Red</option>
                      <option>Solar</option>
                      <option>Mixta</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium">Orden de trabajo</label>
                    <input
                      className="w-full border p-2 text-sm"
                      maxLength={20}
                      value={luminariaOrdenTrabajo}
                      onChange={(e) => setLuminariaOrdenTrabajo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SEMAFORO */}
            {hasSemaforo && (
              <div className="mt-4 border rounded-xl p-3 bg-slate-50/60">
                <h4 className="text-sm font-semibold mb-2">Semáforo</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium">Subtipo</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={semaforoSubtipo}
                      onChange={(e) => setSemaforoSubtipo(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Vehicular</option>
                      <option>Peatonal</option>
                      <option>Acustico</option>
                      <option>Camara</option>
                      <option>Camara de Vigilancia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Código estructura</label>
                    <input
                      className="w-full border p-2 text-sm"
                      value={semaforoCodigoEstructura}
                      onChange={(e) => setSemaforoCodigoEstructura(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Orden de trabajo</label>
                    <input
                      className="w-full border p-2 text-sm"
                      maxLength={20}
                      value={semaforoOrdenTrabajo}
                      onChange={(e) => setSemaforoOrdenTrabajo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CAPACITOR */}
            {hasCapacitor && (
              <div className="mt-4 border rounded-xl p-3 bg-slate-50/60">
                <h4 className="text-sm font-semibold mb-2">Capacitor</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium">Subtipo</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={capacitorSubtipo}
                      onChange={(e) => setCapacitorSubtipo(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Capacitor Fijo</option>
                      <option>Capacitor Automatico</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Código estructura</label>
                    <input
                      className="w-full border p-2 text-sm"
                      value={capacitorCodigoEstructura}
                      onChange={(e) => setCapacitorCodigoEstructura(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Potencia</label>
                    <input
                      className="w-full border p-2 text-sm"
                      maxLength={5}
                      value={capacitorPotencia}
                      onChange={(e) => setCapacitorPotencia(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium">Orden de trabajo</label>
                    <input
                      className="w-full border p-2 text-sm"
                      maxLength={20}
                      value={capacitorOrdenTrabajo}
                      onChange={(e) => setCapacitorOrdenTrabajo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECCIONADOR CUCHILLA */}
            {hasSeccionadorCuchilla && (
              <div className="mt-4 border rounded-xl p-3 bg-slate-50/60">
                <h4 className="text-sm font-semibold mb-2">Seccionador cuchilla</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium">Subtipo</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={seccionadorCuchillaSubtipo}
                      onChange={(e) => setSeccionadorCuchillaSubtipo(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Unipolar</option>
                      <option>Unipolar con Dispositivo Rompe Arco</option>
                      <option>Tripolar</option>
                      <option>Tripolar con Dispositivo Rompe Arco</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Código estructura</label>
                    <input
                      className="w-full border p-2 text-sm"
                      value={seccionadorCuchillaCodigoEstructura}
                      onChange={(e) => setSeccionadorCuchillaCodigoEstructura(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Corriente</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={seccionadorCuchillaCorriente}
                      onChange={(e) => setSeccionadorCuchillaCorriente(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>100 A</option>
                      <option>200 A</option>
                      <option>400 A</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium">Corriente máx. cortocircuito</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={seccionadorCuchillaCorrienteCorto}
                      onChange={(e) => setSeccionadorCuchillaCorrienteCorto(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>6 kA</option>
                      <option>10 kA</option>
                      <option>16 kA</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Tipo uso</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={seccionadorCuchillaTipoUso}
                      onChange={(e) => setSeccionadorCuchillaTipoUso(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Seccionamiento</option>
                      <option>Protección</option>
                      <option>Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Orden de trabajo</label>
                    <input
                      className="w-full border p-2 text-sm"
                      maxLength={20}
                      value={seccionadorCuchillaOrdenTrabajo}
                      onChange={(e) => setSeccionadorCuchillaOrdenTrabajo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PROTECCION DINAMICA */}
            {hasProteccionDinamica && (
              <div className="mt-4 border rounded-xl p-3 bg-slate-50/60">
                <h4 className="text-sm font-semibold mb-2">Protección dinámico</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium">Subtipo</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={proteccionDinamicaSubtipo}
                      onChange={(e) => setProteccionDinamicaSubtipo(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Disyuntor</option>
                      <option>Seccionalizador</option>
                      <option>Interruptor</option>
                      <option>Reconectador</option>
                      <option>Celdas de Seccionamiento</option>
                      <option>Celdas de Interconexión</option>
                      <option>Celdas de Protección</option>
                      <option>Interruptores Subterraneos</option>
                      <option>Controladores-MV</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Código estructura</label>
                    <input
                      className="w-full border p-2 text-sm"
                      value={proteccionDinamicaCodigoEstructura}
                      onChange={(e) => setProteccionDinamicaCodigoEstructura(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Corriente</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={proteccionDinamicaCorriente}
                      onChange={(e) => setProteccionDinamicaCorriente(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>100 A</option>
                      <option>200 A</option>
                      <option>400 A</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium">Observaciones</label>
                    <input
                      className="w-full border p-2 text-sm"
                      maxLength={20}
                      value={proteccionDinamicaObservaciones}
                      onChange={(e) => setProteccionDinamicaObservaciones(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Tipo uso</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={proteccionDinamicaTipoUso}
                      onChange={(e) => setProteccionDinamicaTipoUso(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Protección</option>
                      <option>Seccionamiento</option>
                      <option>Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Control</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={proteccionDinamicaControl}
                      onChange={(e) => setProteccionDinamicaControl(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Manual</option>
                      <option>Automático</option>
                      <option>Telecontrol</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium">Orden de trabajo</label>
                    <input
                      className="w-full border p-2 text-sm"
                      maxLength={20}
                      value={proteccionDinamicaOrdenTrabajo}
                      onChange={(e) => setProteccionDinamicaOrdenTrabajo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECCIONADOR FUSIBLE */}
            {hasSeccionadorFusible && (
              <div className="mt-4 border rounded-xl p-3 bg-slate-50/60">
                <h4 className="text-sm font-semibold mb-2">Seccionador fusible</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium">Subtipo</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={seccionadorFusibleSubtipo}
                      onChange={(e) => setSeccionadorFusibleSubtipo(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Unipolar Abierto</option>
                      <option>Unipolar Cerrado</option>
                      <option>Unipolar Abierto con Dispositivo Rompe Arco</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Código estructura</label>
                    <input
                      className="w-full border p-2 text-sm"
                      value={seccionadorFusibleCodigoEstructura}
                      onChange={(e) => setSeccionadorFusibleCodigoEstructura(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Tirafusible</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={seccionadorFusibleTirafusible}
                      onChange={(e) => setSeccionadorFusibleTirafusible(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Tipo A</option>
                      <option>Tipo B</option>
                      <option>Tipo C</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium">Orden de trabajo</label>
                    <input
                      className="w-full border p-2 text-sm"
                      maxLength={20}
                      value={seccionadorFusibleOrdenTrabajo}
                      onChange={(e) => setSeccionadorFusibleOrdenTrabajo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PUESTO TRANSFORMACION DISTRIBUCION */}
            {hasPuestoTransDistribucion && (
              <div className="mt-4 border rounded-xl p-3 bg-slate-50/60">
                <h4 className="text-sm font-semibold mb-2">Puesto transf. distribución</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium">Subtipo</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={puestoTransDistribucionSubtipo}
                      onChange={(e) => setPuestoTransDistribucionSubtipo(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Transformador Monofásico en Poste</option>
                      <option>Transformador Monofásico en Cabina</option>
                      <option>Padmounted Monofásico Exterior</option>
                      <option>Padmounted Monofásico en Cabina</option>
                      <option>Transformador Trifásico en Poste</option>
                      <option>Transformador Trifásico en Cabina</option>
                      <option>Padmounted Trifásico Exterior</option>
                      <option>Padmounted Trifásico en Cabina</option>
                      <option>Banco de 2 Transformadores en Poste</option>
                      <option>Banco de 2 Transformadores en Cabina</option>
                      <option>Banco de 3 Transformadores en Poste</option>
                      <option>Banco de 3 Transformadores en Cabina</option>
                      <option>Transformador Bifásico en Poste</option>
                      <option>Transformador Bifásico en Cabina</option>
                      <option>Padmounted Bifásico Exterior</option>
                      <option>Padmounted Bifásico en Cabina</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Voltaje media trafo</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={puestoTransDistribucionVoltajeMedia}
                      onChange={(e) => setPuestoTransDistribucionVoltajeMedia(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>13.8 kV</option>
                      <option>22 kV</option>
                      <option>24 kV</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Potencia</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={puestoTransDistribucionPotencia}
                      onChange={(e) => setPuestoTransDistribucionPotencia(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>25 kVA</option>
                      <option>50 kVA</option>
                      <option>100 kVA</option>
                      <option>150 kVA</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium">Configuración BT</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={puestoTransDistribucionConfigBT}
                      onChange={(e) => setPuestoTransDistribucionConfigBT(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Monofásica</option>
                      <option>Bifásica</option>
                      <option>Trifásica</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">No. Trafo</label>
                    <input
                      className="w-full border p-2 text-sm"
                      maxLength={10}
                      value={puestoTransDistribucionNumeroTrafo}
                      onChange={(e) => setPuestoTransDistribucionNumeroTrafo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Código estructura</label>
                    <input
                      className="w-full border p-2 text-sm"
                      value={puestoTransDistribucionCodigoEstructura}
                      onChange={(e) => setPuestoTransDistribucionCodigoEstructura(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium">Voltaje baja trafo</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={puestoTransDistribucionVoltajeBaja}
                      onChange={(e) => setPuestoTransDistribucionVoltajeBaja(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>120/240 V</option>
                      <option>220/127 V</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Configuración lado alta</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={puestoTransDistribucionConfigAlta}
                      onChange={(e) => setPuestoTransDistribucionConfigAlta(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Delta</option>
                      <option>Estrella</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Tipo red</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={puestoTransDistribucionTipoRed}
                      onChange={(e) => setPuestoTransDistribucionTipoRed(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Aérea</option>
                      <option>Subterránea</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium">Tipo</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={puestoTransDistribucionTipo}
                      onChange={(e) => setPuestoTransDistribucionTipo(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Interior</option>
                      <option>Exterior</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Orden de trabajo</label>
                    <input
                      className="w-full border p-2 text-sm"
                      maxLength={20}
                      value={puestoTransDistribucionOrdenTrabajo}
                      onChange={(e) => setPuestoTransDistribucionOrdenTrabajo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PUESTO TRANSFORMACION POTENCIA */}
            {hasPuestoTransPotencia && (
              <div className="mt-4 border rounded-xl p-3 bg-slate-50/60">
                <h4 className="text-sm font-semibold mb-2">Puesto transf. potencia</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium">Subtipo</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={puestoTransPotenciaSubtipo}
                      onChange={(e) => setPuestoTransPotenciaSubtipo(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Transformador con 2 devanados</option>
                      <option>Autotransformador con 2 devanados</option>
                      <option>Transformador con 3 devanados</option>
                      <option>Autransformador con 3 devanados</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Comentarios / Potencia</label>
                    <input
                      className="w-full border p-2 text-sm"
                      maxLength={20}
                      value={puestoTransPotenciaComentarios}
                      onChange={(e) => setPuestoTransPotenciaComentarios(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Potencia kVA</label>
                    <input
                      className="w-full border p-2 text-sm"
                      maxLength={6}
                      value={puestoTransPotenciaKva}
                      onChange={(e) => setPuestoTransPotenciaKva(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium">Propiedad</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={puestoTransPotenciaPropiedad}
                      onChange={(e) => setPuestoTransPotenciaPropiedad(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>CNEL</option>
                      <option>Municipal</option>
                      <option>Privado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Obs./TAP</label>
                    <input
                      className="w-full border p-2 text-sm"
                      maxLength={5}
                      value={puestoTransPotenciaTap}
                      onChange={(e) => setPuestoTransPotenciaTap(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Tipo transf. potencia</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={puestoTransPotenciaTipo}
                      onChange={(e) => setPuestoTransPotenciaTipo(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Elevador</option>
                      <option>Reductor</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium">Orden de trabajo</label>
                    <input
                      className="w-full border p-2 text-sm"
                      maxLength={20}
                      value={puestoTransPotenciaOrdenTrabajo}
                      onChange={(e) => setPuestoTransPotenciaOrdenTrabajo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUBESTACION */}
            {hasSubestacion && (
              <div className="mt-4 border rounded-xl p-3 bg-slate-50/60">
                <h4 className="text-sm font-semibold mb-2">Subestación</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium">Subtipo</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={subestacionSubtipo}
                      onChange={(e) => setSubestacionSubtipo(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Subestacion Interior</option>
                      <option>Subestacion Exterior</option>
                      <option>Subestacion Otros</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Nombre subestación</label>
                    <input
                      className="w-full border p-2 text-sm"
                      maxLength={50}
                      value={subestacionNombre}
                      onChange={(e) => setSubestacionNombre(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Número subestación</label>
                    <input
                      className="w-full border p-2 text-sm"
                      maxLength={50}
                      value={subestacionNumero}
                      onChange={(e) => setSubestacionNumero(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium">Código estructura</label>
                    <input
                      className="w-full border p-2 text-sm"
                      value={subestacionCodigoEstructura}
                      onChange={(e) => setSubestacionCodigoEstructura(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">V. primario</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={subestacionVPrimario}
                      onChange={(e) => setSubestacionVPrimario(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>69 kV</option>
                      <option>138 kV</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">V. secundario</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={subestacionVSecundario}
                      onChange={(e) => setSubestacionVSecundario(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>13.8 kV</option>
                      <option>22 kV</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium">Orden de trabajo</label>
                    <input
                      className="w-full border p-2 text-sm"
                      maxLength={20}
                      value={subestacionOrdenTrabajo}
                      onChange={(e) => setSubestacionOrdenTrabajo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TENSOR */}
            {hasTensor && (
              <div className="mt-4 border rounded-xl p-3 bg-slate-50/60">
                <h4 className="text-sm font-semibold mb-2">Tensor</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium">Subtipo</label>
                    <select
                      className="w-full border p-2 text-sm"
                      value={tensorSubtipo}
                      onChange={(e) => setTensorSubtipo(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      <option>Tensor a tierra en BT</option>
                      <option>Tensor a tierra en MT</option>
                      <option>Tensor a farol en BT</option>
                      <option>Tensor a farol en MT</option>
                      <option>Tensor Poste a Poste en BT</option>
                      <option>Tensor Poste a Poste en MT</option>
                      <option>Tensor a Tierra Doble</option>
                      <option>Tensor Farol Doble</option>
                      <option>Tensor Poste a Poste Doble</option>
                      <option>Tensor de Empuje BT</option>
                      <option>Tensor de Empuje MT</option>
                      <option>Tensor ST</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Código estructura</label>
                    <input
                      className="w-full border p-2 text-sm"
                      value={tensorCodigoEstructura}
                      onChange={(e) => setTensorCodigoEstructura(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Orden de trabajo</label>
                    <input
                      className="w-full border p-2 text-sm"
                      maxLength={20}
                      value={tensorOrdenTrabajo}
                      onChange={(e) => setTensorOrdenTrabajo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {previews.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {previews.map((p, i) => (
              <div key={i} className="w-full h-20 overflow-hidden rounded bg-gray-100 relative">
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute right-1 top-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center z-10"
                  title="Eliminar foto"
                >
                  ×
                </button>
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
