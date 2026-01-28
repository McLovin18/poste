"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Users as UsersIcon, MessageCircle, X } from "lucide-react";
import {
  collection,
  collectionGroup,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";

interface Worker {
  id: string;
  uid: string;
  email: string | null;
  name?: string | null;
  role?: string | null;
}

interface PrivateMessage {
  id: string;
  fromUid: string;
  toUid: string;
  text: string;
  createdAt?: { seconds: number; nanoseconds: number } | Date | null;
}

const STORAGE_KEY_NOTIF_PREFIX = "private_chat_notif_last_open_";

function getChatId(a: string, b: string) {
  return [a, b].sort().join("_");
}

export default function ChatControls() {
  const { user } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [incoming, setIncoming] = useState<PrivateMessage[]>([]);
  const [activePeer, setActivePeer] = useState<Worker | null>(null);
  const [chatMessages, setChatMessages] = useState<PrivateMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [lastNotifOpen, setLastNotifOpen] = useState<Date | null>(null);

  // Cargar última fecha de apertura de notificaciones
  useEffect(() => {
    if (!user) return;
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_NOTIF_PREFIX + user.uid) : null;
      if (raw) {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) setLastNotifOpen(d);
      }
    } catch {
      // ignore
    }
  }, [user]);

  // Cargar lista de trabajadores (colección users)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const arr: Worker[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        arr.push({
          id: d.id,
          uid: d.id,
          email: data.email ?? null,
          name: data.name ?? null,
          role: data.role ?? null,
        });
      });
      setWorkers(arr);
    });
    return () => unsub();
  }, []);

  // Cargar mensajes privados dirigidos al usuario actual (para notificaciones)
  useEffect(() => {
    if (!user) return;
    const q = query(
      collectionGroup(db, "messages"),
      where("toUid", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const arr: PrivateMessage[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        arr.push({
          id: d.id,
          fromUid: data.fromUid,
          toUid: data.toUid,
          text: data.text ?? "",
          createdAt: data.createdAt ?? null,
        });
      });
      // ordenar por createdAt descendente en el cliente
      arr.sort((a, b) => {
        const ta: any = a.createdAt;
        const tb: any = b.createdAt;

        const da =
          ta instanceof Date
            ? ta
            : ta && typeof ta === "object" && "seconds" in ta
            ? new Date(ta.seconds * 1000)
            : null;
        const dbb =
          tb instanceof Date
            ? tb
            : tb && typeof tb === "object" && "seconds" in tb
            ? new Date(tb.seconds * 1000)
            : null;

        if (!da && !dbb) return 0;
        if (!da) return 1;
        if (!dbb) return -1;
        return dbb.getTime() - da.getTime();
      });
      setIncoming(arr);
    });
    return () => unsub();
  }, [user]);

  // Mensajes no leídos para el badge de notificaciones
  const unreadCount = useMemo(() => {
    if (!user) return 0;
    if (!lastNotifOpen) return incoming.length;
    let count = 0;
    for (const m of incoming) {
      const ts: any = m.createdAt;
      if (!ts) continue;
      let d: Date | null = null;
      if (ts instanceof Date) d = ts;
      else if (typeof ts === "object" && ("seconds" in ts)) d = new Date(ts.seconds * 1000);
      if (!d || isNaN(d.getTime())) continue;
      if (d > lastNotifOpen) count++;
    }
    return count;
  }, [incoming, lastNotifOpen, user]);

  const toggleNotif = () => {
    const next = !showNotif;
    setShowNotif(next);
    if (next && user) {
      try {
        const now = new Date();
        setLastNotifOpen(now);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY_NOTIF_PREFIX + user.uid, now.toISOString());
        }
      } catch {
        // ignore
      }
    }
  };

  const toggleUsers = () => {
    setShowUsers((v) => !v);
  };

  const openChatWith = (w: Worker) => {
    setActivePeer(w);
    setShowNotif(false);
    setShowUsers(false);
  };

  // Cargar mensajes del chat individual cuando haya peer activo
  useEffect(() => {
    if (!user || !activePeer) {
      setChatMessages([]);
      return;
    }
    const chatId = getChatId(user.uid, activePeer.uid);
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const arr: PrivateMessage[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        arr.push({
          id: d.id,
          fromUid: data.fromUid,
          toUid: data.toUid,
          text: data.text ?? "",
          createdAt: data.createdAt ?? null,
        });
      });
      setChatMessages(arr);
    });
    return () => unsub();
  }, [user, activePeer]);

  const handleSend = async () => {
    if (!user || !activePeer) return;
    const text = chatInput.trim();
    if (!text) return;
    setSending(true);
    try {
      const chatId = getChatId(user.uid, activePeer.uid);
      // Asegurar documento de chat
      await setDoc(
        doc(db, "chats", chatId),
        {
          participants: [user.uid, activePeer.uid],
        },
        { merge: true }
      );
      await addDoc(collection(db, "chats", chatId, "messages"), {
        fromUid: user.uid,
        toUid: activePeer.uid,
        text,
        createdAt: serverTimestamp(),
      } as any);
      setChatInput("");
    } catch (e) {
      console.error("Error enviando mensaje privado", e);
      alert("No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending) handleSend();
    }
  };

  if (!user) return null;

  return (
    <div className="fixed top-4 right-4 z-40 flex flex-col items-end gap-2">
      {/* Botones de barra superior */}
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur rounded-full shadow border border-slate-200 px-2 py-1">
        <button
          onClick={toggleNotif}
          className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 text-slate-700"
          aria-label="Notificaciones de mensajes"
        >
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-4 px-1 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <Bell size={18} />
        </button>
        <button
          onClick={toggleUsers}
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 text-slate-700"
          aria-label="Ver trabajadores"
        >
          <UsersIcon size={18} />
        </button>
      </div>

      {/* Dropdown de notificaciones */}
      {showNotif && (
        <div className="mt-1 w-72 max-h-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="px-3 py-2 border-b text-xs font-semibold text-slate-700 bg-slate-50 flex justify-between items-center">
            <span>Mensajes recibidos</span>
            <button
              onClick={() => setShowNotif(false)}
              className="text-[10px] text-slate-500 hover:text-slate-700"
            >
              Cerrar
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto text-xs">
            {incoming.length === 0 ? (
              <p className="px-3 py-4 text-center text-[11px] text-slate-400">
                No hay mensajes recibidos todavía.
              </p>
            ) : (
              incoming.map((m) => {
                const from = workers.find((w) => w.uid === m.fromUid);
                const label = from?.name || from?.email || "Trabajador";
                const preview = m.text.length > 60 ? m.text.slice(0, 57) + "..." : m.text;
                return (
                  <button
                    key={m.id}
                    onClick={() => from && openChatWith(from)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b last:border-b-0 border-slate-100 flex flex-col"
                  >
                    <span className="font-semibold text-slate-800 text-[11px]">{label}</span>
                    <span className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{preview}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Dropdown de listado de trabajadores */}
      {showUsers && (
        <div className="mt-1 w-72 max-h-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="px-3 py-2 border-b text-xs font-semibold text-slate-700 bg-slate-50 flex justify-between items-center">
            <span>Trabajadores</span>
            <button
              onClick={() => setShowUsers(false)}
              className="text-[10px] text-slate-500 hover:text-slate-700"
            >
              Cerrar
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto text-xs">
            {workers
              .filter((w) => w.uid !== user.uid)
              .map((w) => {
                const label = w.name || w.email || "Trabajador";
                return (
                  <div
                    key={w.uid}
                    className="px-3 py-2 border-b last:border-b-0 border-slate-100 flex items-center justify-between gap-2"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 text-[11px]">{label}</span>
                      {w.role && (
                        <span className="text-[10px] text-slate-500">{w.role}</span>
                      )}
                    </div>
                    <button
                      onClick={() => openChatWith(w)}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0037A7] text-white hover:bg-[#002f8e]"
                      aria-label="Chat con trabajador"
                    >
                      <MessageCircle size={16} />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Panel de chat individual */}
      {activePeer && (
        <div className="fixed bottom-4 right-4 w-80 sm:w-96 h-96 bg-white shadow-xl rounded-2xl border border-slate-200 flex flex-col overflow-hidden z-50">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-800 text-white text-sm font-semibold">
            <span>
              Chat con {activePeer.name || activePeer.email || "Trabajador"}
              {activePeer.role ? ` (${activePeer.role})` : ""}
            </span>
            <button
              onClick={() => setActivePeer(null)}
              className="p-1 rounded hover:bg-white/20"
              aria-label="Cerrar chat individual"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 bg-slate-50 p-3 space-y-1.5 overflow-y-auto text-sm">
            {chatMessages.length === 0 ? (
              <p className="text-center text-gray-400 mt-4 text-xs">No hay mensajes todavía.</p>
            ) : (
              chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={
                    "w-full flex mb-1.5 " +
                    (m.fromUid === user.uid ? "justify-end" : "justify-start")
                  }
                >
                  <div
                    className={
                      "max-w-[70%] px-3 py-2 rounded-2xl text-[13px] whitespace-pre-wrap break-words shadow-sm " +
                      (m.fromUid === user.uid
                        ? "bg-[#0037A7] text-white rounded-br-sm"
                        : "bg-white text-slate-900 border border-slate-200 rounded-bl-sm")
                    }
                  >
                    <p
                      className={
                        "mb-0.5 text-[11px] " +
                        (m.fromUid === user.uid
                          ? "text-white/80 text-right"
                          : "text-slate-500")
                      }
                    >
                      {m.fromUid === user.uid ? "Tú" : "Contacto"}
                    </p>
                    <p>{m.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-slate-200 p-2 bg-white flex flex-col gap-1">
            <textarea
              className="w-full text-sm border border-slate-300 rounded-md px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-[#0037A7]"
              rows={2}
              placeholder="Escribe un mensaje..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown}
            />
            <button
              onClick={handleSend}
              disabled={sending || !chatInput.trim()}
              className="self-end px-4 py-1.5 text-sm rounded-md bg-[#0037A7] text-white hover:bg-[#002f8e] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
