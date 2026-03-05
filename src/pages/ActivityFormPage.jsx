import React from "react";
import { useNavigate, useParams } from "react-router-dom";

const TYPE_LABEL = {
  "meet-greet": "MEET & GREET",
  outdoor: "OUTDOOR",
  "hanging-out": "HANGING OUT",
  party: "PARTY",
};

export default function ActivityFormPage() {
  const navigate = useNavigate();
  const { type } = useParams();

  const title = TYPE_LABEL[type] || "ACTIVITY";

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-[#0b0b0f]" />
      <div className="absolute inset-0 -z-10 opacity-70 bg-[radial-gradient(ellipse_at_top,rgba(255,215,120,0.16),rgba(0,0,0,0)_55%)]" />

      <div className="max-w-3xl mx-auto px-5 py-10 text-white">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <div className="ss-title-lux text-3xl">{title}</div>
            <div className="text-white/60">
              Unos novog eventa (forma dolazi u sljedećem koraku)
            </div>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-2xl px-4 py-2 font-semibold bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 transition"
          >
            Natrag
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
          <div className="text-white/70">
            Routing radi. Sljedeći korak: kompletna premium forma + spremanje u
            localStorage.
          </div>
        </div>
      </div>
    </div>
  );
}