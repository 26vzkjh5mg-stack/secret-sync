import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const KEY_SESSION = "ss_session_nickname";
const KEY_PIN = "ss_session_pin";

export default function LoginPage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");

  const canContinue = nickname.trim().length > 0 && pin.length === 4;

  function handlePinChange(e) {
    // samo 0-9, max 4
    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(v);
  }

  function onContinue() {
    if (!canContinue) return;
    localStorage.setItem(KEY_SESSION, nickname.trim());
    localStorage.setItem(KEY_PIN, pin);
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-[#0b0b0f]" />
      <div className="absolute inset-0 -z-10 opacity-70 bg-[radial-gradient(ellipse_at_top,rgba(255,215,120,0.16),rgba(0,0,0,0)_55%)]" />

      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-7 shadow-2xl">
          <div className="flex items-center gap-3 mb-5">
            <img
              src="/Logo.png"
              alt="Secret Sync"
              className="h-10 w-10 rounded-xl object-contain"
            />
            <div>
              <div className="ss-title-lux text-2xl leading-tight">Login</div>
              <div className="text-white/60 text-sm">
                Diskretan pristup (nickname + PIN)
              </div>
            </div>
          </div>

          <label className="block text-white/70 text-sm mb-2">
            Nickname <span className="text-white/40">(obavezno)</span>
          </label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="npr. Luna_77"
            className="w-full mb-4 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/25"
          />

          <label className="block text-white/70 text-sm mb-2">
            PIN (4 znamenke) <span className="text-white/40">(obavezno)</span>
          </label>
          <input
            value={pin}
            onChange={handlePinChange}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="••••"
            className="w-full mb-2 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/25 tracking-widest"
          />

          <div className="text-xs text-white/45 mb-5">
            PIN je lokalno na uređaju (za diskreciju). Kasnije možemo dodati jaču zaštitu.
          </div>

          <button
            onClick={onContinue}
            disabled={!canContinue}
            className={[
              "w-full rounded-2xl px-5 py-3 font-semibold transition",
              canContinue
                ? "bg-[#d4af37] text-black hover:opacity-90"
                : "bg-white/10 text-white/40 cursor-not-allowed",
            ].join(" ")}
          >
            Nastavi na Dashboard
          </button>

          <div className="mt-4 text-xs text-white/35">
            Tip: koristi nadimke, ne stvarne identitete.
          </div>
        </div>
      </div>
    </div>
  );
}