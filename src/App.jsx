import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import GdprPage from "./pages/GdprPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* GDPR landing page */}
        <Route path="/" element={<GdprPage />} />

        {/* Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;