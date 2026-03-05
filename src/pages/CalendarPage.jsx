import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const KEY_EVENTS = "ss_events";

function loadEventsSafe() {
  try {
    const raw = localStorage.getItem(KEY_EVENTS);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveEventsSafe(events) {
  try {
    localStorage.setItem(KEY_EVENTS, JSON.stringify(events));
  } catch {
    // noop
  }
}

function toMs(e) {
  const d = e?.startDate; // ISO YYYY-MM-DD
  const t = e?.startTime || "00:00";
  const ms = new Date(`${d}T${t}`).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function formatISOToDDMMYYYY(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ""))) return "";
  const [y, m, d] = String(iso).split("-");
  return `${d}.${m}.${y}`;
}

export default function CalendarPage() {
  const navigate = useNavigate();

  // inicijalno učitaj + sortiraj
  const [events, setEvents] = useState(() => {
    const arr = loadEventsSafe();
    return [...arr]
      .map((e) => ({ ...e, __ms: toMs(e) }))
      .sort((a, b) => a.__ms - b.__ms);
  });

  const countText = useMemo(() => {
    if (!events.length) return "0";
    return String(events.length);
  }, [events.length]);

  function handleDelete(id) {
    const target = events.find((x) => x.id === id);
    const label = target?.title ? ` (${target.title})` : "";
    const ok = window.confirm(`Obrisati event${label}?`);
    if (!ok) return;

    const next = events.filter((e) => e.id !== id);
    // spremi bez __ms polja
    saveEventsSafe(next.map(({ __ms, ...rest }) => rest));
    setEvents(next);
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[#0b0b0f]" />
      <div className="absolute inset-0 -z-10 opacity-70 bg-[radial-gradient(ellipse_at_top,rgba(255,215,120,0.16),rgba(0,0,0,0)_55%)]" />

      <div className="max-w-6xl mx-auto px-6 py-10 text-white">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/Logo.png"
              alt="Secret Sync"
              className="h-10 w-10 object-contain drop-shadow-[0_0_12px_rgba(212,175,55,0.25)]"
            />
            <div>
              <div className="text-3xl font-semibold">
                <span className="text-ss-gold">Secret</span> Sync
              </div>
              <div className="text-white/60 text-sm">Calendar</div>
            </div>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-2xl px-4 py-2 font-semibold bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 transition"
          >
            Natrag
          </button>
        </div>

        {/* Content */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold ss-gold-text">All events</h2>
              <div className="text-xs text-white/40 mt-1">
                Ukupno: <span className="text-white/60">{countText}</span>
              </div>
            </div>

            <div className="text-xs text-white/40">
              localStorage: <span className="text-white/60">{KEY_EVENTS}</span>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="mt-6 text-white/50 text-sm">
              Još nema spremljenih eventa. Kreiraj prvi event s dashboarda.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {events.map((e) => {
                const date =
                  e.startDateDisplay ||
                  formatISOToDDMMYYYY(e.startDate) ||
                  e.startDate ||
                  "";
                const time = e.startTime || "";

                return (
                  <div
                    key={e.id}
                    className="rounded-2xl border border-white/10 bg-black/25 p-4 hover:border-ss-gold/30 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold">
                          {e.title || "Event"}
                        </div>
                        <div className="text-xs text-white/60 mt-1">
                          {date} {time}
                          {e.location ? ` • ${e.location}` : ""}
                        </div>
                        {e.withWhom ? (
                          <div className="text-xs text-white/50 mt-1">
                            S kime: {e.withWhom}
                          </div>
                        ) : null}
                        {e.notes ? (
                          <div className="text-xs text-white/50 mt-1">
                            Napomena: {e.notes}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-xs text-white/40">
                          {e.type || ""}
                        </div>

                        <button
                          onClick={() => handleDelete(e.id)}
                          className="rounded-xl px-3 py-1.5 text-xs font-semibold bg-white/5 text-white/70 border border-white/10 hover:bg-red-500/15 hover:border-red-400/30 hover:text-red-200 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 text-xs text-white/35">
            Sljedeći korak: week view + filter po tipu + opcija “Clear all”.
          </div>
        </div>
      </div>
    </div>
  );
}