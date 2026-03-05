export default function DashboardPage({ onLock, onOpen }) {
  const activityCards = [
    { id: "meet", title: "MEET & GREET", img: "/cards/meet.jpg" },
    { id: "outdoor", title: "OUTDOOR", img: "/cards/outdoor.jpg" },
    { id: "hanging", title: "HANGING OUT", img: "/cards/hanging.jpg" },
    { id: "party", title: "PARTY", img: "/cards/party.jpg" },
  ];

  const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="min-h-screen p-8">
      {/* HEADER */}
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Left: Logo + Title */}
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
              onClick={() => onOpen(card.id)}
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
          onClick={() => onOpen("calendar")}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left hover:border-ss-gold/40 transition"
        >
          <h2 className="text-xl font-semibold ss-gold-text">Calendar</h2>
          <p className="text-sm text-white/60 mt-1">Weekly overview</p>

          <div className="mt-6 grid grid-cols-7 gap-2 text-xs text-center text-white/80">
            {week.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-white/10 relative">
                {(i === 1 || i === 4) && (
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-ss-gold" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-6">
            <p className="text-xs ss-gold-text">UPCOMING EVENTS</p>

            <div className="mt-3 space-y-2 text-sm">
              <div className="bg-white/10 p-2 rounded-lg">Meet & Greet</div>
              <div className="bg-white/10 p-2 rounded-lg">Outdoor</div>
              <div className="bg-white/10 p-2 rounded-lg">Party</div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}