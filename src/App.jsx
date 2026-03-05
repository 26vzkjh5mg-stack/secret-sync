import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  const [unlocked, setUnlocked] = useState(false);

  function handleUnlock(pass) {
    // pass trenutno ne koristimo, ali kasnije hoćemo za crypto
    setUnlocked(true);
  }

  function handleLock() {
    setUnlocked(false);
  }

  function handleOpen(cardId) {
    alert(`Open card: ${cardId}`);
  }

  if (!unlocked) {
    return <LoginPage onUnlock={handleUnlock} />;
  }

  return <DashboardPage onLock={handleLock} onOpen={handleOpen} />;
}