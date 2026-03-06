import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const KEY_EVENTS = "ss_events";

const TYPE_LABEL = {
  "meet-greet": "MEET & GREET",
  outdoor: "OUTDOOR",
  "hanging-out": "HANGING OUT",
  party: "PARTY",
};

const FILTERS = [
  { key: "all", label: "ALL" },
  { key: "meet-greet", label: "MEET & GREET" },
  { key: "outdoor", label: "OUTDOOR" },
  { key: "hanging-out", label: "HANGING OUT" },
  { key: "party", label: "PARTY" },
];

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
  } catch {}
}

function toMs(e) {
  const d = e?.startDate;
  const t = e?.startTime || "00:00";
  const ms = new Date(`${d}T${t}`).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function formatISOToDDMMYYYY(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ""))) return "";
  const [y, m, d] = String(iso).split("-");
  return `${d}.${m}.${y}`;
}

function isoFromDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function mondayIndex(jsDay) {
  return (jsDay + 6) % 7;
}

function monthLabel(d) {
  return d.toLocaleDateString("hr-HR", { month: "long", year: "numeric" });
}

function formatEventTimeRange(eventObj) {
  const start = eventObj?.startTime?.trim?.() || "";
  const end = eventObj?.endTime?.trim?.() || "";

  if (start && end) return `${start} – ${end}`;
  return start || end || "";
}

// ---------- ICS helpers ----------
function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatICSDateUTC(dateObj) {
  const y = dateObj.getUTCFullYear();
  const m = pad2(dateObj.getUTCMonth() + 1);
  const d = pad2(dateObj.getUTCDate());
  const hh = pad2(dateObj.getUTCHours());
  const mm = pad2(dateObj.getUTCMinutes());
  const ss = pad2(dateObj.getUTCSeconds());
  return `${y}${m}${d}T${hh}${mm}${ss}Z`;
}

function escapeICS(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function safeFileName(s) {
  return (
    String(s || "event")
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 60) || "event"
  );
}

function buildICSForEvent(e) {
  const startDate = e?.startDate;
  const startTime = e?.startTime || "00:00";
  const start = new Date(`${startDate}T${startTime}`);
  const startValid = Number.isFinite(start.getTime());

  const endDate = e?.endDate || startDate;
  const endTime = e?.endTime || "";
  let end;

  if (endTime) {
    end = new Date(`${endDate}T${endTime}`);
  } else if (startValid) {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  } else {
    end = new Date();
  }

  const uid =
    `${e?.id || globalThis.crypto?.randomUUID?.() || Date.now()}@secret-sync`;
  const dtstamp = formatICSDateUTC(new Date());
  const dtstart = formatICSDateUTC(startValid ? start : new Date());
  const dtend = formatICSDateUTC(
    Number.isFinite(end.getTime()) ? end : new Date()
  );

  const summary = escapeICS(
    e?.isPrivate ? "Private event" : e?.title || "Secret Sync Event"
  );
  const location = escapeICS(e?.isPrivate ? "" : e?.location || "");
  const descriptionParts = [];

  if (!e?.isPrivate) {
    if (e?.withWhom) descriptionParts.push(`S kime: ${e.withWhom}`);
    if (e?.notes) descriptionParts.push(`Napomena: ${e.notes}`);
  } else {
    descriptionParts.push("Private event");
  }

  const description = escapeICS(descriptionParts.join("\n"));

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Secret Sync//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
  ];

  if (location) lines.push(`LOCATION:${location}`);
  if (description) lines.push(`DESCRIPTION:${description}`);

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}

function downloadTextFile(filename, content, mime = "text/calendar;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function CalendarPage() {
  const navigate = useNavigate();

  const [events, setEvents] = useState(() => {
    const arr = loadEventsSafe();
    return [...arr]
      .map((e) => ({ ...e, __ms: toMs(e) }))
      .sort((a, b) => a.__ms - b.__ms);
  });

  const [filterType, setFilterType] = useState("all");
  const [selectedDayISO, setSelectedDayISO] = useState(null);

  const [undoState, setUndoState] = useState(null);
  const undoTimerRef = useRef(null);

  function clearUndoTimer() {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }

  function startUndoCountdown(kind, payload, seconds = 5) {
    clearUndoTimer();

    const expiresAt = Date.now() + seconds * 1000;
    setUndoState({ kind, payload, expiresAt });

    undoTimerRef.current = setTimeout(() => {
      setUndoState(null);
      undoTimerRef.current = null;
    }, seconds * 1000);
  }

  function handleUndo() {
    if (!undoState) return;

    if (undoState.kind === "delete-one") {
      const restored = undoState.payload;
      if (!restored) return;

      const next = [...events, restored]
        .map((e) => ({ ...e, __ms: e.__ms ?? toMs(e) }))
        .sort((a, b) => (a.__ms || 0) - (b.__ms || 0));

      saveEventsSafe(next.map(({ __ms, ...rest }) => rest));
      setEvents(next);
    }

    if (undoState.kind === "clear-all") {
      const backupArr = Array.isArray(undoState.payload) ? undoState.payload : [];
      const next = [...backupArr]
        .map((e) => ({ ...e, __ms: e.__ms ?? toMs(e) }))
        .sort((a, b) => (a.__ms || 0) - (b.__ms || 0));

      saveEventsSafe(next.map(({ __ms, ...rest }) => rest));
      setEvents(next);

      setSelectedDayISO(null);
      setFilterType("all");
    }

    clearUndoTimer();
    setUndoState(null);
  }

  function handleExportICS(e) {
    const ics = buildICSForEvent(e);
    const datePart = e?.startDate ? String(e.startDate).split("-").join("") : "date";
    const titlePart = safeFileName(
      e?.isPrivate ? "Private_Event" : e?.title || TYPE_LABEL[e?.type] || "SecretSync"
    );
    const fileName = `SecretSync_${datePart}_${titlePart}.ics`;
    downloadTextFile(fileName, ics);
  }

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(1);
    return d;
  });

  const todayISO = isoFromDate(new Date());

  const monthInfo = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const daysInMonth = last.getDate();

    const startPad = mondayIndex(first.getDay());
    const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;

    return { year, month, daysInMonth, startPad, totalCells };
  }, [cursor]);

  const eventsCountByDay = useMemo(() => {
    const map = {};
    for (const e of events) {
      const key = e?.startDate;
      if (!key) continue;
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [events]);

  const monthlyEvents = useMemo(() => {
    const ym = `${monthInfo.year}-${String(monthInfo.month + 1).padStart(2, "0")}`;

    const filtered = events.filter((e) => {
      if (!e?.startDate) return false;
      if (!String(e.startDate).startsWith(ym)) return false;
      if (filterType !== "all" && e.type !== filterType) return false;
      if (selectedDayISO && e.startDate !== selectedDayISO) return false;
      return true;
    });

    return [...filtered].sort((a, b) => (a.__ms || 0) - (b.__ms || 0));
  }, [events, monthInfo.year, monthInfo.month, filterType, selectedDayISO]);

  function handleDelete(id) {
    const target = events.find((x) => x.id === id);
    const label = target?.title ? ` (${target.title})` : "";
    const ok = window.confirm(`Obrisati event${label}?`);
    if (!ok) return;

    clearUndoTimer();
    setUndoState(null);

    const next = events.filter((e) => e.id !== id);
    saveEventsSafe(next.map(({ __ms, ...rest }) => rest));
    setEvents(next);

    if (selectedDayISO) {
      const stillHas = next.some((e) => e?.startDate === selectedDayISO);
      if (!stillHas) setSelectedDayISO(null);
    }

    if (target) startUndoCountdown("delete-one", target, 5);
  }

  function handleClearAll() {
    if (events.length === 0) return;

    const ok = window.confirm(
      "Obrisati SVE evente?\n\nOva radnja briše sve spremljene evente na ovom uređaju i ne može se poništiti."
    );
    if (!ok) return;

    clearUndoTimer();
    setUndoState(null);

    const backup = events.map(({ __ms, ...rest }) => rest);

    try {
      localStorage.removeItem(KEY_EVENTS);
    } catch {}

    setEvents([]);
    setSelectedDayISO(null);
    setFilterType("all");

    startUndoCountdown("clear-all", backup, 5);
  }

  function goPrevMonth() {
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setSelectedDayISO(null);
  }

  function goNextMonth() {
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setSelectedDayISO(null);
  }

  const weekHeader = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const selectedDayLabel = selectedDayISO
    ? formatISOToDDMMYYYY(selectedDayISO) || selectedDayISO
    : null;

  const undoSecondsLeft = useMemo(() => {
    if (!undoState?.expiresAt) return 0;
    const msLeft = Math.max(0, undoState.expiresAt - Date.now());
    return Math.ceil(msLeft / 1000);
  }, [undoState]);

  const undoMessage = useMemo(() => {
    if (!undoState) return "";
    if (undoState.kind === "delete-one") return "Event obrisan";
    if (undoState.kind === "clear-all") return "Svi eventi obrisani";
    return "Promjena";
  }, [undoState]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[#0b0b0f]" />
      <div className="absolute inset-0 -z-10 opacity-70 bg-[radial-gradient(ellipse_at_top,rgba(255,215,120,0.16),rgba(0,0,0,0)_55%)]" />

      <div className="max-w-6xl mx-auto px-6 py-10 text-white">
        {/* HEADER */}
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

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT CALENDAR */}
          <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-6 md:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xl font-semibold ss-gold-text">{monthLabel(cursor)}</div>
                <div className="text-xs text-white/40 mt-1">Klikni datum za filtriranje desne liste.</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={goPrevMonth}
                  className="rounded-xl px-3 py-2 text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  Prev
                </button>
                <button
                  onClick={goNextMonth}
                  className="rounded-xl px-3 py-2 text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-2 text-[11px] text-center text-white/70">
              {weekHeader.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-7 gap-2">
              {Array.from({ length: monthInfo.totalCells }).map((_, idx) => {
                const dayNum = idx - monthInfo.startPad + 1;
                const inMonth = dayNum >= 1 && dayNum <= monthInfo.daysInMonth;

                if (!inMonth) {
                  return <div key={idx} className="h-10 rounded-lg bg-white/5 border border-white/5" />;
                }

                const d = new Date(monthInfo.year, monthInfo.month, dayNum);
                const iso = isoFromDate(d);
                const isToday = iso === todayISO;
                const isSelected = iso === selectedDayISO;
                const count = eventsCountByDay[iso] || 0;

                return (
                  <button
                    key={iso}
                    onClick={() => setSelectedDayISO((cur) => (cur === iso ? null : iso))}
                    className={[
                      "h-10 rounded-lg bg-white/10 border border-white/10 relative flex items-center justify-center",
                      "hover:border-ss-gold/30",
                      isToday ? "ring-1 ring-ss-gold/60" : "",
                      isSelected ? "border-ss-gold/50 ring-1 ring-ss-gold/40" : "",
                    ].join(" ")}
                  >
                    <span className={isToday ? "text-ss-gold" : "text-white/80"}>{dayNum}</span>

                    {count > 0 && (
                      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-ss-gold" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT EVENT LIST */}
          <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold ss-gold-text">
                  {selectedDayISO ? "Events for day" : "Events this month"}
                </h2>

                <div className="text-xs text-white/40 mt-1">
                  {selectedDayISO && (
                    <>
                      Datum: <span className="text-white/60">{selectedDayLabel}</span>
                      <button onClick={() => setSelectedDayISO(null)} className="ml-2 text-ss-gold">
                        Clear day
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex flex-wrap justify-end gap-2">
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFilterType(f.key)}
                      className={[
                        "rounded-xl px-3 py-2 text-[11px] font-semibold border",
                        filterType === f.key
                          ? "bg-[#d4af37] text-black border-[#d4af37]"
                          : "bg-white/5 text-white/70 border-white/10",
                      ].join(" ")}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={events.length === 0}
                  className={[
                    "rounded-xl px-3 py-2 text-[11px] font-semibold border transition",
                    events.length === 0
                      ? "bg-white/5 text-white/25 border-white/10 cursor-not-allowed"
                      : "bg-white/5 text-white/70 border-white/10 hover:bg-red-500/15 hover:border-red-400/30 hover:text-red-200",
                  ].join(" ")}
                  title={events.length === 0 ? "Nema eventa za brisanje" : "Obriši sve evente"}
                >
                  Clear all
                </button>
              </div>
            </div>

            {monthlyEvents.length === 0 ? (
              <div className="mt-6 text-white/50 text-sm">Nema eventa.</div>
            ) : (
              <div className="mt-6 space-y-3">
                {monthlyEvents.map((e) => {
                  const date =
                    e.startDateDisplay ||
                    formatISOToDDMMYYYY(e.startDate) ||
                    e.startDate ||
                    "";

                  const timeRange = formatEventTimeRange(e);

                  return (
                    <div
                      key={e.id}
                      className="rounded-2xl border border-white/10 bg-black/25 p-4 hover:border-ss-gold/30 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold">
                            {e.isPrivate ? "🔒 Private event" : e.title || "Event"}
                          </div>

                          <div className="text-xs text-white/60 mt-1">
                            {date}
                            {timeRange ? ` ${timeRange}` : ""}
                            {!e.isPrivate && e.location ? ` • ${e.location}` : ""}
                          </div>

                          {!e.isPrivate && e.withWhom && (
                            <div className="text-xs text-white/50 mt-1">
                              S kime: {e.withWhom}
                            </div>
                          )}

                          {!e.isPrivate && e.notes && (
                            <div className="text-xs text-white/50 mt-1">
                              Napomena: {e.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="text-xs text-white/40">{TYPE_LABEL[e.type] || e.type}</div>

                          <div className="flex gap-2 flex-wrap justify-end">
                            <button
                              onClick={() => handleExportICS(e)}
                              className="rounded-xl px-3 py-1.5 text-xs font-semibold bg-white/5 text-white/70 border border-white/10 hover:bg-ss-gold/15 hover:border-ss-gold/30 hover:text-ss-gold transition"
                              title="Export to private calendar (.ics)"
                            >
                              To Private Calendar
                            </button>

                            <button
                              onClick={() => navigate(`/activity/${e.type}/edit/${e.id}`)}
                              className="rounded-xl px-3 py-1.5 text-xs font-semibold bg-white/5 text-white/70 border border-white/10 hover:bg-blue-500/15 hover:border-blue-400/30 hover:text-blue-200 transition"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleDelete(e.id)}
                              className="rounded-xl px-3 py-1.5 text-xs font-semibold bg-white/5 text-white/70 border border-white/10 hover:bg-red-500/15 hover:border-red-400/30 hover:text-red-200 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* UNDO TOAST */}
      {undoState && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl shadow-2xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="text-sm text-white/80">
              {undoMessage} <span className="text-white/40">({Math.max(0, undoSecondsLeft)}s)</span>
            </div>

            <button
              type="button"
              onClick={handleUndo}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold bg-white/5 text-white/80 border border-white/10 hover:bg-ss-gold/15 hover:border-ss-gold/30 hover:text-ss-gold transition"
            >
              UNDO
            </button>
          </div>
        </div>
      )}
    </div>
  );
}