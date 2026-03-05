import { useState } from "react";

export default function LoginPage({ onUnlock }) {
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    if (password.length < 4) {
      alert("Password must be at least 4 characters");
      return;
    }

    onUnlock(password);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-10 shadow-glass">

        <h1 className="text-3xl font-semibold text-center">
          <span className="text-ss-gold">Secret</span> Sync
        </h1>

        <p className="text-center text-white/60 mt-2">
          Enter password to unlock
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-ss-gold"
          />

          <button
            type="submit"
            className="w-full rounded-xl bg-ss-gold py-3 font-semibold text-black"
          >
            Unlock
          </button>

        </form>

      </div>
    </div>
  );
}