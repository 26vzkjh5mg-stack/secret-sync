import React, { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const KEY_EVENTS = "ss_events";

const TYPE_META = {
  "meet-greet": { label: "MEET & GREET" },
  outdoor: { label: "OUTDOOR" },
  "hanging-out": { label: "HANGING OUT" },
  party: { label: "PARTY" },
};

function loadEvents() {
  try {
    const raw = localStorage.getItem(KEY_EVENTS);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function saveEvents(events) {
  localStorage.setItem(KEY_EVENTS, JSON.stringify(events));
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function todayDdMmYyyy() {
  const d = new Date();
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function isValidDateDDMMYYYY(v) {
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(v)) return false;
  const [dd, mm, yyyy] = v.split(".").map(Number);
  if (mm < 1 || mm > 12) return false;
  if (dd < 1 || dd > 31) return false;
  const dt = new Date(yyyy, mm - 1, dd);
  return (
    dt.getFullYear() === yyyy &&
    dt.getMonth() === mm - 1 &&
    dt.getDate() === dd
  );
}

function ddMmYyyyToISO(v) {
  const [dd, mm, yyyy] = v.split(".").map(Number);
  return `${yyyy}-${pad2(mm)}-${pad2(dd)}`; // YYYY-MM-DD
}

// ISO (YYYY-MM-DD) -> DD.MM.YYYY
function isoToDdMmYyyy(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ""))) return "";
  const [yyyy, mm, dd] = String(iso).split("-");
  return `${dd}.${mm}.${yyyy}`;
}

function isValidTimeHHMM(v) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
}

function toDateTimeMs(isoDate, timeHHMM) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const [hh, mm] = timeHHMM.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
}

export default function ActivityFormPage({ mode }) {
  const navigate = useNavigate();
  const { type, id } = useParams();
  const meta = TYPE_META[type] || { label: "ACTIVITY" };

  const isEdit = mode === "edit" || Boolean(id);

  // učitaj event za edit (jednom)
  const existing = useMemo(() => {
    if (!isEdit || !id) return null;
    const arr = loadEvents();
    const found = arr.find((e) => String(e?.id) === String(id));
    return found || null;
  }, [isEdit, id]);

  const [withWhom, setWithWhom] = useState(existing?.withWhom || "");
  const [startDate, setStartDate] = useState(
    existing?.startDateDisplay ||
      (existing?.startDate ? isoToDdMmYyyy(existing.startDate) : "") ||
      todayDdMmYyyy()
  ); // DD.MM.YYYY
  const [startTime, setStartTime] = useState(existing?.startTime || "18:00"); // 24h
  const [endDate, setEndDate] = useState(
    existing?.endDateDisplay ||
      (existing?.endDate ? isoToDdMmYyyy(existing.endDate) : "") ||
      todayDdMmYyyy()
  );
  const [endTime, setEndTime] = useState(existing?.endTime || "20:00");
  const [location, setLocation] = useState(existing?.location || "");
  const [notes, setNotes] = useState(existing?.notes || "");

  // refs for native date pickers
  const startPickerRef = useRef(null);
  const endPickerRef = useRef(null);

  // ako je edit route, ali event ne postoji (npr. obrisan), vrati usera
  const missingEditEvent = isEdit && id && !existing;

  const errors = useMemo(() => {
    const e = {};
    if (!withWhom.trim()) e.withWhom = "Obavezno polje";

    if (!startDate.trim()) e.startDate = "Obavezno polje";
    else if (!isValidDateDDMMYYYY(startDate.trim()))
      e.startDate = "Format mora biti DD.MM.YYYY";

    if (!isValidTimeHHMM(startTime.trim()))
      e.startTime = "Vrijeme mora biti 24h format HH:MM";

    if (!endDate.trim()) e.endDate = "Obavezno polje";
    else if (!isValidDateDDMMYYYY(endDate.trim()))
      e.endDate = "Format mora biti DD.MM.YYYY";

    if (!isValidTimeHHMM(endTime.trim()))
      e.endTime = "Vrijeme mora biti 24h format HH:MM";

    if (!location.trim()) e.location = "Obavezno polje";

    // range check
    if (
      isValidDateDDMMYYYY(startDate.trim()) &&
      isValidDateDDMMYYYY(endDate.trim()) &&
      isValidTimeHHMM(startTime.trim()) &&
      isValidTimeHHMM(endTime.trim())
    ) {
      const startISO = ddMmYyyyToISO(startDate.trim());
      const endISO = ddMmYyyyToISO(endDate.trim());
      const startMs = toDateTimeMs(startISO, startTime.trim());
      const endMs = toDateTimeMs(endISO, endTime.trim());
      if (endMs < startMs) e.range = "Završetak ne može biti prije početka";
    }

    return e;
  }, [withWhom, startDate, startTime, endDate, endTime, location]);

  const canSave = Object.keys(errors).length === 0;

  function onSave() {
    if (!canSave) return;

    const startISO = ddMmYyyyToISO(startDate.trim());
    const endISO = ddMmYyyyToISO(endDate.trim());

    const base = {
      type,
      title: meta.label,
      withWhom: withWhom.trim(),

      startDate: startISO,
      startTime: startTime.trim(),
      endDate: endISO,
      endTime: endTime.trim(),

      startDateDisplay: startDate.trim(),
      endDateDisplay: endDate.trim(),

      location: location.trim(),
      notes: notes.trim(),
    };

    const events = loadEvents();

    if (isEdit && id) {
      // UPDATE existing by id (keep createdAt if exists)
      const next = events.map((ev) => {
        if (String(ev?.id) !== String(id)) return ev;
        return {
          ...ev,
          ...base,
          updatedAt: new Date().toISOString(),
        };
      });

      saveEvents(next);
      navigate("/calendar");
      return;
    }

    // CREATE new
    const event = {
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
      ...base,
      createdAt: new Date().toISOString(),
    };

    events.unshift(event);
    saveEvents(events);

    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[#0b0b0f]" />
      <div className="absolute inset-0 -z-10 opacity-70 bg-[radial-gradient(ellipse_at_top,rgba(255,215,120,0.16),rgba(0,0,0,0)_55%)]" />

      <div className="max-w-3xl mx-auto px-5 py-10 text-white">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <div className="ss-title-lux text-2xl md:text-3xl">{meta.label}</div>
            <div className="text-white/60 text-sm">
              {isEdit ? "Uređivanje eventa" : "Unos novog eventa"}
            </div>
          </div>

          <button
            onClick={() => navigate(isEdit ? "/calendar" : "/dashboard")}
            className="rounded-2xl px-4 py-2 font-semibold bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 transition"
          >
            Natrag
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-6 md:p-8">
          {missingEditEvent ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
              Ovaj event ne postoji (možda je obrisan). Vrati se na kalendar.
            </div>
          ) : null}

          {/* With whom */}
          <div className="mt-1">
            <label className="block text-white/70 text-sm mb-2">
              S kime je sastanak <span className="text-ss-gold">*</span>
            </label>
            <input
              value={withWhom}
              onChange={(e) => setWithWhom(e.target.value)}
              placeholder="Nickname / opis"
              className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/25"
            />
            {errors.withWhom && (
              <div className="mt-1 text-xs text-red-300">{errors.withWhom}</div>
            )}
          </div>

          {/* Dates + times */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            <div>
              <label className="block text-white/70 text-sm mb-2">
                Datum početka <span className="text-ss-gold">*</span>
              </label>

              <div className="relative">
                <input
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="DD.MM.YYYY"
                  inputMode="numeric"
                  className="w-full pr-12 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/25"
                />

                <button
                  type="button"
                  onClick={() => startPickerRef.current?.showPicker?.()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center justify-center"
                  aria-label="Odaberi datum početka"
                >
                  <span className="text-white/70">📅</span>
                </button>

                <input
                  ref={startPickerRef}
                  type="date"
                  className="absolute opacity-0 pointer-events-none"
                  tabIndex={-1}
                  onChange={(e) => {
                    const iso = e.target.value; // YYYY-MM-DD
                    const ddmmyyyy = isoToDdMmYyyy(iso);
                    if (ddmmyyyy) setStartDate(ddmmyyyy);
                  }}
                />
              </div>

              {errors.startDate && (
                <div className="mt-1 text-xs text-red-300">{errors.startDate}</div>
              )}
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">
                Vrijeme početka (24h) <span className="text-ss-gold">*</span>
              </label>
              <input
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="HH:MM"
                inputMode="numeric"
                className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/25"
              />
              {errors.startTime && (
                <div className="mt-1 text-xs text-red-300">{errors.startTime}</div>
              )}
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">
                Datum završetka <span className="text-ss-gold">*</span>
              </label>

              <div className="relative">
                <input
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="DD.MM.YYYY"
                  inputMode="numeric"
                  className="w-full pr-12 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/25"
                />

                <button
                  type="button"
                  onClick={() => endPickerRef.current?.showPicker?.()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center justify-center"
                  aria-label="Odaberi datum završetka"
                >
                  <span className="text-white/70">📅</span>
                </button>

                <input
                  ref={endPickerRef}
                  type="date"
                  className="absolute opacity-0 pointer-events-none"
                  tabIndex={-1}
                  onChange={(e) => {
                    const iso = e.target.value; // YYYY-MM-DD
                    const ddmmyyyy = isoToDdMmYyyy(iso);
                    if (ddmmyyyy) setEndDate(ddmmyyyy);
                  }}
                />
              </div>

              {errors.endDate && (
                <div className="mt-1 text-xs text-red-300">{errors.endDate}</div>
              )}
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">
                Vrijeme završetka (24h) <span className="text-ss-gold">*</span>
              </label>
              <input
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="HH:MM"
                inputMode="numeric"
                className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/25"
              />
              {errors.endTime && (
                <div className="mt-1 text-xs text-red-300">{errors.endTime}</div>
              )}
            </div>
          </div>

          {errors.range && (
            <div className="mt-4 text-sm text-red-300">{errors.range}</div>
          )}

          {/* Location */}
          <div className="mt-5">
            <label className="block text-white/70 text-sm mb-2">
              Lokacija <span className="text-ss-gold">*</span>
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="npr. Zagreb, hotel / ulica / lokacija"
              className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/25"
            />
            {errors.location && (
              <div className="mt-1 text-xs text-red-300">{errors.location}</div>
            )}

            {location.trim() && (
              <div className="mt-2">
                <a
                  className="text-xs text-ss-gold hover:opacity-80"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    location.trim()
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Otvori u Google Maps
                </a>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="mt-5">
            <label className="block text-white/70 text-sm mb-2">
              Napomena <span className="text-white/35">(opcionalno)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Dodatne informacije..."
              rows={4}
              className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/25 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onSave}
              disabled={!canSave || missingEditEvent}
              className={[
                "rounded-2xl px-5 py-3 font-semibold transition",
                canSave && !missingEditEvent
                  ? "bg-[#d4af37] text-black hover:opacity-90"
                  : "bg-white/10 text-white/40 cursor-not-allowed",
              ].join(" ")}
            >
              Spremi event
            </button>

            <button
              onClick={() => navigate(isEdit ? "/calendar" : "/dashboard")}
              className="rounded-2xl px-5 py-3 font-semibold bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 transition"
            >
              Odustani
            </button>
          </div>

          <div className="mt-4 text-xs text-white/40">
            Event se sprema lokalno (localStorage:{" "}
            <span className="text-white/60">{KEY_EVENTS}</span>).
          </div>
        </div>
      </div>
    </div>
  );
}