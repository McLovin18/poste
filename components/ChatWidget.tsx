"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { collection, addDoc, serverTimestamp, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";

interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  userName: string | null;
  role: string | null;
  createdAt?: { seconds: number; nanoseconds: number } | Date | null;
}

const CHAT_COLLECTION = "generalChat";
const STORAGE_KEY_LAST_OPEN = "chat_general_last_open";

export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [lastOpen, setLastOpen] = useState<Date | null>(null);

  // Cargar última fecha de lectura desde localStorage
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_LAST_OPEN) : null;
      if (raw) {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) setLastOpen(d);
      }
    } catch {
      // ignore
    }
  }, []);

  // Suscripción en tiempo real al chat general
  useEffect(() => {
    const q = query(collection(db, CHAT_COLLECTION), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr: ChatMessage[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        arr.push({
          id: d.id,
          text: data.text ?? "",
          userId: data.userId ?? "",
          userName: data.userName ?? null,
          role: data.role ?? null,
          createdAt: data.createdAt ?? null,
        });
      });
      setMessages(arr);
    });
    return () => unsub();
  }, []);

  const handleToggleOpen = () => {
    const newOpen = !open;
    setOpen(newOpen);
    if (!newOpen) return;
    try {
      const now = new Date();
      setLastOpen(now);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_LAST_OPEN, now.toISOString());
      }
    } catch {
      // ignore
    }
  };

  const handleSend = async () => {
    if (!user) {
      alert("Debes iniciar sesión para enviar mensajes.");
      return;
    }
    const text = input.trim();
    if (!text) return;
    setSending(true);
    try {
      const payload = {
        text,
        userId: user.uid,
        userName: user.name || user.email || "Trabajador",
        role: user.role || null,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, CHAT_COLLECTION), payload as any);
      setInput("");
    } catch (e) {
      console.error("Error enviando mensaje de chat", e);
      alert("No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  const unreadCount = useMemo(() => {
    if (!lastOpen) return messages.length;
    let count = 0;
    for (const m of messages) {
      const ts: any = m.createdAt;
      let d: Date | null = null;
      if (!ts) continue;
      if (ts instanceof Date) d = ts;
      else if (typeof ts === "object" && ("seconds" in ts)) {
        d = new Date(ts.seconds * 1000);
      }
      if (!d || isNaN(d.getTime())) continue;
      if (d > lastOpen) count++;
    }
    return count;
  }, [messages, lastOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending) handleSend();
    }
  };

  // No mostrar chat si no hay usuario (trabajadores autenticados solamente)
  if (!user) return null;

  return (
    <div className="fixed z-50 bottom-4 right-4 flex flex-col items-end gap-2">
      {/* Panel de chat */}
      {open && (
        <div className="w-80 sm:w-96 h-96 bg-white shadow-xl rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#0037A7] text-white text-base font-semibold">
            <span>Chat equipo de trabajo</span>
            <button onClick={handleToggleOpen} className="p-1 rounded hover:bg-white/20" aria-label="Cerrar chat">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 bg-slate-50 p-3 space-y-1.5 overflow-y-auto text-sm">
            {messages.length === 0 ? (
              <p className="text-center text-gray-400 mt-4">Aún no hay mensajes. ¡Escribe el primero!</p>
            ) : (
              messages.map((m) => {
                const label = `${m.userName || "Trabajador"}${m.role ? ` (${m.role})` : ""}`;
                return (
                  <div
                    key={m.id}
                    className={
                      "w-full flex mb-1.5 " +
                      (m.userId === user?.uid ? "justify-end" : "justify-start")
                    }
                  >
                    <div
                      className={
                        "max-w-[70%] px-3 py-2 rounded-2xl text-[13px] whitespace-pre-wrap break-words shadow-sm " +
                        (m.userId === user?.uid
                          ? "bg-[#0037A7] text-white rounded-br-sm"
                          : "bg-white text-slate-900 border border-slate-200 rounded-bl-sm")
                      }
                    >
                      <p
                        className={
                          "font-semibold mb-0.5 text-[12px] " +
                          (m.userId === user?.uid
                            ? "text-white/80 text-right"
                            : "text-[#0037A7]")
                        }
                      >
                        {label}
                      </p>
                      <p>{m.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="border-t border-slate-200 p-2 bg-white flex flex-col gap-1">
            <textarea
              className="w-full text-sm border border-slate-300 rounded-md px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-[#0037A7]"
              rows={2}
              placeholder="Escribe un mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="self-end px-4 py-1.5 text-sm rounded-md bg-[#0037A7] text-white hover:bg-[#002f8e] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Enviar
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante con badge de no leídos */}
      <button
        onClick={handleToggleOpen}
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#0037A7] text-white shadow-lg hover:bg-[#002f8e] focus:outline-none"
        aria-label="Abrir chat general"
      >
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-600 text-[11px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        <MessageCircle size={26} />
      </button>
    </div>
  );
}
