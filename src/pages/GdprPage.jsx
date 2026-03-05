import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const KEY_GDPR = "ss_gdpr_accepted";

function setGdprAccepted(value) {
  localStorage.setItem(KEY_GDPR, value ? "true" : "false");
}

export default function GdprPage() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}.`;
  }, []);

  const onAccept = () => {
    if (!checked) return;
    setGdprAccepted(true);
    navigate("/login");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-[#0b0b0f]" />
      <div className="absolute inset-0 -z-10 opacity-70 bg-[radial-gradient(ellipse_at_top,rgba(255,215,120,0.18),rgba(0,0,0,0)_55%)]" />
      <div className="absolute inset-0 -z-10 opacity-70 bg-[radial-gradient(ellipse_at_bottom,rgba(255,215,120,0.08),rgba(0,0,0,0)_55%)]" />

      <div className="max-w-3xl mx-auto px-5 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <img
            src="/Logo.png"
            alt="Secret Sync"
            className="h-10 w-10 rounded-xl object-contain"
          />
          <div>
            <div className="ss-title-lux text-2xl leading-tight">Secret Sync</div>
            <div className="text-white/60 text-sm">
              GDPR & Privacy • {today}
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-6 md:p-8">
          <h1 className="text-white text-xl md:text-2xl font-semibold mb-3">
            Izjava o privatnosti i obradi podataka (GDPR)
          </h1>

          <p className="text-white/70 text-sm md:text-base leading-relaxed mb-4">
            Ova aplikacija služi za privatnu evidenciju aktivnosti. U ovoj fazi
            aplikaciju koristiš na vlastitom uređaju.
          </p>

          <div className="space-y-3 text-white/70 text-sm md:text-base leading-relaxed">
            <p>
              <span className="text-white/85 font-medium">Pohrana podataka:</span>{" "}
              Unosi (eventi) se mogu spremati lokalno na ovom uređaju (npr. u
              browser storage) kako bi aplikacija mogla prikazati kalendar i
              nadolazeće događaje. Podaci se u ovoj fazi ne šalju na server.
            </p>
            <p>
              <span className="text-white/85 font-medium">Osobni podaci:</span>{" "}
              Ne unosi stvarna imena, brojeve ili osjetljive informacije ako to
              ne želiš. Preporuka je koristiti nadimke.
            </p>
            <p>
              <span className="text-white/85 font-medium">Kontrola:</span>{" "}
              Podatke možeš obrisati brisanjem podataka preglednika (site data).
              Kasnije možemo dodati i “Reset” opciju u aplikaciji.
            </p>
            <p>
              <span className="text-white/85 font-medium">Diskrecija:</span>{" "}
              Aplikacija će imati login (nickname/PIN) prije pristupa sadržaju.
            </p>
          </div>

          {/* Checkbox */}
          <div className="mt-6 flex items-start gap-3">
            <input
              id="gdpr"
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-white/20 bg-white/10"
            />
            <label htmlFor="gdpr" className="text-white/75 text-sm md:text-base">
              Pročitao/la sam i prihvaćam izjavu o privatnosti. Razumijem da je u
              ovoj fazi pohrana lokalna na uređaju i da ne trebam unositi stvarne
              osobne podatke.
            </label>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onAccept}
              disabled={!checked}
              className={[
                "rounded-2xl px-5 py-3 font-semibold transition",
                checked
                  ? "bg-[#d4af37] text-black hover:opacity-90"
                  : "bg-white/10 text-white/40 cursor-not-allowed",
              ].join(" ")}
            >
              Prihvaćam i nastavljam
            </button>

            <button
              onClick={() => window.close()}
              className="rounded-2xl px-5 py-3 font-semibold bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 transition"
            >
              Odustani
            </button>
          </div>

          <div className="mt-6 text-xs text-white/45">
            Napomena: Ovo je početna verzija teksta. Finalnu GDPR/Privacy verziju
            dodatno ćemo izbrusiti prije javnog lansiranja.
          </div>
        </div>
      </div>
    </div>
  );
}