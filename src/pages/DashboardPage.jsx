import React from "react";
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

// NEW — helpers za tjedan (Mon–Sun)
function weekStartMonday(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = (day === 0 ? -6 : 1) - day; // pomak na ponedjeljak
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function isoFromDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// NEW (1) — kategorije koje želimo prikazati uvijek (4 komada)
const CATEGORIES = [
  { key: "meet-greet", label: "MEET & GREET" },
  { key: "outdoor", label: "OUTDOOR" },
  { key: "hanging-out", label: "HANGING OUT" },
  { key: "party", label: "PARTY" },
];

// NEW (2) — pretvori event start u ms (za usporedbu/sort)
function toMs(e) {
  const d = e?.startDate; // ISO YYYY-MM-DD
  const t = e?.startTime || "00:00";
  const ms = new Date(`${d}T${t}`).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

// NEW (3) — uzmi najbliži budući event za zadani type
function nearestUpcomingByType(events, typeKey) {
  const now = Date.now();

  const filtered = events
    .filter((e) => e?.type === typeKey)
    .map((e) => ({ ...e, __ms: toMs(e) }))
    .filter((e) => e.__ms >= now);

  filtered.sort((a, b) => a.__ms - b.__ms); // nearest first
  return filtered[0] || null;
}

export default function DashboardPage({ onLock, onOpen }) {
  const navigate = useNavigate();

  const activityCards = [
    { id: "meet", title: "MEET & GREET", img: "/cards/meet.jpg" },
    { id: "outdoor", title: "OUTDOOR", img: "/cards/outdoor.jpg" },
    { id: "hanging", title: "HANGING OUT", img: "/cards/hanging.jpg" },
    { id: "party", title: "PARTY", img: "/cards/party.jpg" },
  ];

  const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const routeForActivity = (id) => {
    switch (id) {
      case "meet":
        return "/activity/meet-greet/new";
      case "outdoor":
        return "/activity/outdoor/new";
      case "hanging":
        return "/activity/hanging-out/new";
      case "party":
        return "/activity/party/new";
      default:
        return "/dashboard";
    }
  };

  const events = loadEventsSafe();

  // NEW (4) — 1 event po kategoriji (najbliži budući po datumu)
  const upcomingByCategory = CATEGORIES.map((c) => ({
    ...c,
    event: nearestUpcomingByType(events, c.key),
  }));

  // NEW — weekly dots iz localStorage (Mon–Sun)
  const weekStart = weekStartMonday(new Date());
  const todayISO = isoFromDate(new Date());

  // Map: "YYYY-MM-DD" -> broj eventa taj dan
  const eventsByDay = events.reduce((acc, e) => {
    const key = e?.startDate; // ISO
    if (key) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen p-8">
      {/* HEADER */}
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img
            src="/Logo.png"
            alt="Secret Sync"
            className="h-10 w-10 object-contain drop-shadow-[0_0_12px_rgba(212,175,55,0.25)]"
          />

          <h1 className="text-3xl font-semibold">
            <span className="text-ss-gold">Secret</span> Sync
          </h1>
        </div>

        <button
          onClick={onLock}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20"
        >
          Lock
        </button>
      </div>

      {/* GRID */}
      <div className="max-w-6xl mx-auto mt-10 grid md:grid-cols-3 gap-6">
        {/* ACTIVITY CARDS */}
        <div className="md:col-span-2 grid sm:grid-cols-2 gap-6">
          {activityCards.map((card) => (
            <button
              key={card.id}
              onClick={() => navigate(routeForActivity(card.id))}
              className="group relative rounded-3xl overflow-hidden border border-white/10 hover:border-ss-gold/40 transition"
            >
              <img
                src={card.img}
                alt={card.title}
                className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:opacity-75 transition"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-[radial-gradient(700px_260px_at_50%_30%,rgba(212,175,55,0.18),transparent_60%)]" />

              <div className="ss-card-center">
                <h2 className="ss-title-lux text-2xl md:text-3xl">
                  {card.title}
                </h2>
              </div>

              <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10 group-hover:ring-ss-gold/30 transition" />
            </button>
          ))}
        </div>

        {/* CALENDAR CARD */}
        <button
          onClick={() => navigate("/calendar")}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left hover:border-ss-gold/40 transition"
        >
          <h2 className="text-xl font-semibold ss-gold-text">Calendar</h2>
          <p className="text-sm text-white/60 mt-1">Weekly overview</p>

          {/* WEEK HEADER: Mon..Sun + day-of-month */}
          <div className="mt-6 grid grid-cols-7 gap-2 text-xs text-center text-white/80">
            {Array.from({ length: 7 }).map((_, i) => {
              const dayDate = addDays(weekStart, i);
              const iso = isoFromDate(dayDate);
              const dayNumber = dayDate.getDate();
              const isToday = iso === todayISO;

              return (
                <div key={iso} className="flex flex-col items-center">
                  <span>{week[i]}</span>
                  <span
                    className={[
                      "mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full",
                      isToday
                        ? "ring-1 ring-ss-gold/60 text-ss-gold"
                        : "text-white/50",
                    ].join(" ")}
                  >
                    {dayNumber}
                  </span>
                </div>
              );
            })}
          </div>

          {/* WEEK GRID: dots from events */}
          <div className="mt-3 grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => {
              const dayDate = addDays(weekStart, i);
              const iso = isoFromDate(dayDate);
              const count = eventsByDay[iso] || 0;

              return (
                <div key={iso} className="h-10 rounded-lg bg-white/10 relative">
                  {count > 0 && (
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-ss-gold" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <p className="text-xs ss-gold-text">UPCOMING EVENTS</p>

            <div className="mt-3 space-y-2 text-sm">
              {upcomingByCategory.map((row) => (
                <div key={row.key} className="bg-white/10 p-2 rounded-lg">
                  <div className="font-semibold">{row.label}</div>

                  {row.event ? (
                    <div className="text-xs text-white/60">
                      {(row.event.startDateDisplay || row.event.startDate) || ""}{" "}
                      {row.event.startTime || ""}
                      {row.event.location ? ` • ${row.event.location}` : ""}
                    </div>
                  ) : (
                    <div className="text-xs text-white/40">
                      Nema upcoming eventa
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}